import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { debounce } from 'lodash-es';
import { useTranslation, type TFunction } from 'react-i18next';
import { useSWRConfig } from 'swr';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, type Control } from 'react-hook-form';
import {
  Button,
  ButtonSet,
  Column,
  Form,
  FormGroup,
  InlineLoading,
  InlineNotification,
  Row,
  Search,
  SkeletonText,
  Stack,
  Tag,
  TextArea,
  Tile,
} from '@carbon/react';
import { Add, WarningFilled, CloseFilled } from '@carbon/react/icons';
import {
  createAttachment,
  createErrorHandler,
  type Encounter,
  ExtensionSlot,
  OpenmrsDatePicker,
  ResponsiveWrapper,
  restBaseUrl,
  showModal,
  showSnackbar,
  type UploadedFile,
  useConfig,
  useLayoutType,
  useSession,
  useVisitContextStore,
} from '@openmrs/esm-framework';
import { type DefaultPatientWorkspaceProps, useAllowedFileExtensions } from '@openmrs/esm-patient-common-lib';
import type { ConfigObject } from '../config-schema';
import type { Concept, Diagnosis, DiagnosisPayload, VisitNotePayload } from '../types';
import {
  deletePatientDiagnosis,
  fetchDiagnosisConceptsByName,
  savePatientDiagnosis,
  saveVisitNote,
  updateVisitNote,
  useVisitNotes,
} from './visit-notes.resource';
import styles from './visit-notes-form.scss';

type VisitNotesFormData = Omit<z.infer<ReturnType<typeof createSchema>>, 'images'> & {
  images?: UploadedFile[];
};

interface DiagnosesDisplayProps {
  fieldName: string;
  isDiagnosisNotSelected: (diagnosis: Concept) => boolean;
  isLoading: boolean;
  isSearching: boolean;
  onAddDiagnosis: (diagnosis: Concept, searchInputField: string) => void;
  searchResults: Array<Concept>;
  t: TFunction;
  value: string;
}

interface DiagnosisSearchProps {
  control: Control<VisitNotesFormData>;
  error?: Object;
  handleSearch: (fieldName) => void;
  labelText: string;
  name: 'noteDate' | 'primaryDiagnosisSearch' | 'secondaryDiagnosisSearch' | 'clinicalNote';
  placeholder: string;
  setIsSearching: (isSearching: boolean) => void;
}

const createSchema = (t: TFunction) => {
  return z.object({
    noteDate: z.date(),
    primaryDiagnosisSearch: z.string(),
    secondaryDiagnosisSearch: z.string().optional(),
    clinicalNote: z.string().optional(),
    images: z.array(z.any()).optional(),
  });
};

interface VisitNotesFormProps extends DefaultPatientWorkspaceProps {
  encounter?: Encounter;
  formContext: 'creating' | 'editing';
}

const VisitNotesForm: React.FC<VisitNotesFormProps> = ({
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  patientUuid,
  promptBeforeClosing,
  encounter,
  formContext = 'creating',
}) => {
  const isEditing: boolean = Boolean(formContext === 'editing' && encounter?.id);
  const searchTimeoutInMs = 500;
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const session = useSession();
  const config = useConfig<ConfigObject>();
  const memoizedState = useMemo(() => ({ patientUuid }), [patientUuid]);
  const { clinicianEncounterRole, encounterNoteTextConceptUuid, encounterTypeUuid, formConceptUuid } =
    config.visitNoteConfig;
  const [isLoadingPrimaryDiagnoses, setIsLoadingPrimaryDiagnoses] = useState(false);
  const [isLoadingSecondaryDiagnoses, setIsLoadingSecondaryDiagnoses] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPrimaryDiagnoses, setSelectedPrimaryDiagnoses] = useState<Array<Diagnosis>>([]);
  const [selectedSecondaryDiagnoses, setSelectedSecondaryDiagnoses] = useState<Array<Diagnosis>>([]);
  const [searchPrimaryResults, setSearchPrimaryResults] = useState<Array<Concept>>(null);
  const [searchSecondaryResults, setSearchSecondaryResults] = useState<Array<Concept>>(null);
  const [combinedDiagnoses, setCombinedDiagnoses] = useState<Array<Diagnosis>>([]);
  const [rows, setRows] = useState<number>();
  const [error, setError] = useState<Error>(null);
  const { allowedFileExtensions } = useAllowedFileExtensions();

  const visitNoteFormSchema = useMemo(() => createSchema(t), [t]);

  const customResolver = useCallback(
    async (data, context, options) => {
      const zodResult = await zodResolver(visitNoteFormSchema)(data, context, options);
      if (selectedPrimaryDiagnoses.length === 0) {
        return {
          ...zodResult,
          errors: {
            ...zodResult.errors,
            primaryDiagnosisSearch: {
              type: 'custom',
              message: t('primaryDiagnosisRequired', 'Choose at least one primary diagnosis'),
            },
          },
        };
      }

      return zodResult;
    },
    [visitNoteFormSchema, selectedPrimaryDiagnoses, t],
  );

  const {
    clearErrors,
    control,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    setValue,
    watch,
  } = useForm<VisitNotesFormData>({
    mode: 'onSubmit',
    resolver: customResolver,
    defaultValues: {
      primaryDiagnosisSearch: '',
      noteDate: isEditing ? new Date(encounter.datetime) : new Date(),
      clinicalNote: isEditing
        ? String(encounter?.obs?.find((obs) => obs.concept.uuid === encounterNoteTextConceptUuid)?.value || '')
        : '',
    },
  });

  useEffect(() => {
    promptBeforeClosing(() => isDirty);
  }, [isDirty, promptBeforeClosing]);

  useEffect(() => {
    if (encounter?.diagnoses?.length) {
      try {
        const transformedDiagnoses = encounter.diagnoses.map((d) => ({
          patient: patientUuid,
          diagnosis: {
            coded: d.diagnosis.coded?.uuid,
          },
          certainty: d.certainty,
          rank: d.rank,
          display: d.display,
        }));

        const primaryDiagnoses = transformedDiagnoses.filter((d) => d.rank === 1);
        const secondaryDiagnoses = transformedDiagnoses.filter((d) => d.rank === 2);

        setSelectedPrimaryDiagnoses(primaryDiagnoses);
        setSelectedSecondaryDiagnoses(secondaryDiagnoses);
        setCombinedDiagnoses([...primaryDiagnoses, ...secondaryDiagnoses]);
      } catch (err) {
        setError(new Error(t('errorTransformingDiagnoses', 'Error transforming diagnoses')));
        createErrorHandler();
      }
    }
  }, [encounter, patientUuid, t]);

  const currentImages = watch('images');

  const { mutateVisitNotes } = useVisitNotes(patientUuid);
  const { mutateVisit } = useVisitContextStore();
  const { mutate } = useSWRConfig();

  const mutateAttachments = useCallback(
    () => mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/attachment`)),
    [mutate],
  );

  const locationUuid = session?.sessionLocation?.uuid;
  const providerUuid = session?.currentProvider?.uuid;

  const debouncedSearch = useMemo(
    () =>
      debounce((fieldQuery, fieldName) => {
        clearErrors('primaryDiagnosisSearch');
        if (fieldQuery) {
          if (fieldName === 'primaryDiagnosisSearch') {
            setIsLoadingPrimaryDiagnoses(true);
          } else if (fieldName === 'secondaryDiagnosisSearch') {
            setIsLoadingSecondaryDiagnoses(true);
          }

          fetchDiagnosisConceptsByName(fieldQuery, config.diagnosisConceptClass)
            .then((matchingConceptDiagnoses: Array<Concept>) => {
              if (fieldName === 'primaryDiagnosisSearch') {
                setSearchPrimaryResults(matchingConceptDiagnoses);
                setIsLoadingPrimaryDiagnoses(false);
              } else if (fieldName === 'secondaryDiagnosisSearch') {
                setSearchSecondaryResults(matchingConceptDiagnoses);
                setIsLoadingSecondaryDiagnoses(false);
              }
            })
            .catch((e) => {
              setError(e);
              createErrorHandler();
            });
        }
      }, searchTimeoutInMs),
    [config.diagnosisConceptClass, clearErrors],
  );

  const handleSearch = useCallback(
    (fieldName) => {
      const fieldQuery = watch(fieldName);
      if (fieldQuery) {
        debouncedSearch(fieldQuery, fieldName);
      }
      setIsSearching(false);
    },
    [debouncedSearch, watch],
  );

  const createDiagnosis = useCallback(
    (concept: Concept) => ({
      certainty: 'PROVISIONAL',
      display: concept.display,
      diagnosis: {
        coded: concept.uuid,
      },
      patient: patientUuid,
      rank: 2,
    }),
    [patientUuid],
  );

  const handleAddDiagnosis = useCallback(
    (conceptDiagnosisToAdd: Concept, searchInputField: string) => {
      const newDiagnosis = createDiagnosis(conceptDiagnosisToAdd);
      if (searchInputField === 'primaryDiagnosisSearch') {
        newDiagnosis.rank = 1;
        setValue('primaryDiagnosisSearch', '');
        setSearchPrimaryResults([]);
        setSelectedPrimaryDiagnoses((selectedDiagnoses) => [...selectedDiagnoses, newDiagnosis]);
        clearErrors('primaryDiagnosisSearch');
      } else if (searchInputField === 'secondaryDiagnosisSearch') {
        setValue('secondaryDiagnosisSearch', '');
        setSearchSecondaryResults([]);
        setSelectedSecondaryDiagnoses((selectedDiagnoses) => [...selectedDiagnoses, newDiagnosis]);
      }
      setCombinedDiagnoses((combinedDiagnoses) => [...combinedDiagnoses, newDiagnosis]);
    },
    [createDiagnosis, setValue, clearErrors],
  );

  const handleRemoveDiagnosis = useCallback(
    (diagnosisToRemove: Diagnosis, searchInputField) => {
      if (searchInputField === 'primaryInputSearch') {
        setSelectedPrimaryDiagnoses(
          selectedPrimaryDiagnoses.filter(
            (diagnosis) => diagnosis.diagnosis.coded !== diagnosisToRemove.diagnosis.coded,
          ),
        );
      } else if (searchInputField === 'secondaryInputSearch') {
        setSelectedSecondaryDiagnoses(
          selectedSecondaryDiagnoses.filter(
            (diagnosis) => diagnosis.diagnosis.coded !== diagnosisToRemove.diagnosis.coded,
          ),
        );
      }
      setCombinedDiagnoses(
        combinedDiagnoses.filter((diagnosis) => diagnosis.diagnosis.coded !== diagnosisToRemove.diagnosis.coded),
      );
    },
    [combinedDiagnoses, selectedPrimaryDiagnoses, selectedSecondaryDiagnoses],
  );

  const isDiagnosisNotSelected = (diagnosis: Concept) => {
    const isPrimaryDiagnosisSelected = selectedPrimaryDiagnoses.some(
      (selectedDiagnosis) => diagnosis.uuid === selectedDiagnosis.diagnosis.coded,
    );
    const isSecondaryDiagnosisSelected = selectedSecondaryDiagnoses.some(
      (selectedDiagnosis) => diagnosis.uuid === selectedDiagnosis.diagnosis.coded,
    );

    return !isPrimaryDiagnosisSelected && !isSecondaryDiagnosisSelected;
  };

  const showImageCaptureModal = useCallback(() => {
    const close = showModal('capture-photo-modal', {
      saveFile: (file: UploadedFile) => {
        if (file.capturedFromWebcam && !file.fileName.includes('.')) {
          file.fileName = `${file.fileName}.png`;
        }

        setValue('images', currentImages ? [...currentImages, file] : [file]);
        close();
        return Promise.resolve();
      },
      closeModal: () => {
        close();
      },
      allowedExtensions:
        allowedFileExtensions && Array.isArray(allowedFileExtensions)
          ? allowedFileExtensions.filter((ext) => !/pdf/i.test(ext))
          : [],
      collectDescription: true,
      multipleFiles: true,
    });
  }, [allowedFileExtensions, currentImages, setValue]);

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...currentImages];
    updatedImages.splice(index, 1);
    setValue('images', updatedImages);

    showSnackbar({
      title: t('imageRemoved', 'Image removed'),
      kind: 'success',
      isLowContrast: true,
    });
  };

  const onSubmit = useCallback(
    (data: VisitNotesFormData) => {
      const { noteDate, clinicalNote, images } = data;

      if (!selectedPrimaryDiagnoses.length) {
        return;
      }

      let finalNoteDate = dayjs(noteDate);
      const now = new Date();
      if (finalNoteDate.diff(now, 'minute') <= 30) {
        finalNoteDate = null;
      }

      const existingClinicalNoteObs = encounter?.obs?.find((obs) => obs.concept.uuid === encounterNoteTextConceptUuid);

      const visitNotePayload: VisitNotePayload = {
        encounterDatetime: finalNoteDate?.format(),
        form: formConceptUuid,
        patient: patientUuid,
        location: locationUuid,
        encounterProviders: [
          {
            encounterRole: clinicianEncounterRole,
            provider: providerUuid,
          },
        ],
        encounterType: encounterTypeUuid,
        obs: clinicalNote
          ? [
              {
                concept: { uuid: encounterNoteTextConceptUuid, display: '' },
                value: clinicalNote,
                ...(existingClinicalNoteObs && { uuid: existingClinicalNoteObs.uuid }),
              },
            ]
          : [],
      };

      const abortController = new AbortController();

      const savePromise = isEditing
        ? updateVisitNote(abortController, encounter.id, visitNotePayload)
        : saveVisitNote(abortController, visitNotePayload);

      savePromise
        .then((response) => {
          if (response.status === 201 || response.status === 200) {
            const encounterUuid = encounter?.id || response.data.uuid;

            // If editing, first delete existing diagnoses
            if (isEditing && encounter?.diagnoses?.length) {
              return Promise.all(
                encounter.diagnoses.map((diagnosis) => deletePatientDiagnosis(abortController, diagnosis.uuid)),
              ).then(() => encounterUuid);
            }

            return encounterUuid;
          }
        })
        .then((encounterUuid) => {
          return Promise.all(
            combinedDiagnoses.map((diagnosis) => {
              const diagnosesPayload: DiagnosisPayload = {
                encounter: encounterUuid,
                patient: patientUuid,
                condition: null,
                diagnosis: {
                  coded: diagnosis.diagnosis.coded,
                },
                certainty: diagnosis.certainty,
                rank: diagnosis.rank,
              };
              return savePatientDiagnosis(abortController, diagnosesPayload);
            }),
          );
        })
        .then(() => {
          if (images?.length) {
            return Promise.all(
              images.map((image) => {
                const imageToUpload: UploadedFile = {
                  base64Content: image.base64Content,
                  file: image.file,
                  fileName: image.fileName,
                  fileType: image.fileType,
                  fileDescription: image.fileDescription || '',
                };
                return createAttachment(patientUuid, imageToUpload);
              }),
            );
          } else {
            return Promise.resolve([]);
          }
        })
        .then(() => {
          mutateVisit();
          mutateVisitNotes();

          if (images?.length) {
            mutateAttachments();
          }

          closeWorkspaceWithSavedChanges();

          showSnackbar({
            isLowContrast: true,
            subtitle: t('visitNoteNowVisible', 'It is now visible on the Visits page'),
            kind: 'success',
            title: t('visitNoteSaved', 'Visit note saved'),
          });
        })
        .catch((err) => {
          createErrorHandler();

          showSnackbar({
            title: t('visitNoteSaveError', 'Error saving visit note'),
            kind: 'error',
            isLowContrast: false,
            subtitle: err?.responseBody?.error?.message ?? err.message,
          });
        });
    },
    [
      clinicianEncounterRole,
      closeWorkspaceWithSavedChanges,
      combinedDiagnoses,
      encounter?.diagnoses,
      encounter?.id,
      encounter?.obs,
      encounterNoteTextConceptUuid,
      encounterTypeUuid,
      formConceptUuid,
      isEditing,
      locationUuid,
      mutateAttachments,
      mutateVisit,
      mutateVisitNotes,
      patientUuid,
      providerUuid,
      selectedPrimaryDiagnoses.length,
      t,
    ],
  );

  const onError = (errors) => console.error(errors);

  return (
    <Form className={styles.form} onSubmit={handleSubmit(onSubmit, onError)}>
      <ExtensionSlot name="visit-context-header-slot" state={{ patientUuid }} />

      {isTablet && (
        <Row className={styles.headerGridRow}>
          <ExtensionSlot name="visit-form-header-slot" className={styles.dataGridRow} state={memoizedState} />
        </Row>
      )}

      <div className={styles.formContainer}>
        <Stack gap={2}>
          {isTablet ? <h2 className={styles.heading}>{t('addVisitNote', 'Add a visit note')}</h2> : null}
          <Row className={styles.row}>
            <Column sm={1}>
              <span className={styles.columnLabel}>{t('date', 'Date')}</span>
            </Column>
            <Column sm={3}>
              <Controller
                name="noteDate"
                control={control}
                render={({ field, fieldState }) => (
                  <ResponsiveWrapper>
                    <OpenmrsDatePicker
                      {...field}
                      data-testid="visitDateTimePicker"
                      id="visitDateTimePicker"
                      invalid={Boolean(fieldState?.error?.message)}
                      invalidText={fieldState?.error?.message}
                      isDisabled={isEditing}
                      labelText={t('visitDate', 'Visit date')}
                      maxDate={new Date()}
                    />
                  </ResponsiveWrapper>
                )}
              />
            </Column>
          </Row>
          <div className={styles.diagnosesText}>
            {selectedPrimaryDiagnoses && selectedPrimaryDiagnoses.length ? (
              <>
                {selectedPrimaryDiagnoses.map((diagnosis, index) => (
                  <Tag
                    className={styles.tag}
                    filter
                    key={index}
                    onClose={() => handleRemoveDiagnosis(diagnosis, 'primaryInputSearch')}
                    type="red"
                  >
                    {diagnosis.display}
                  </Tag>
                ))}
              </>
            ) : null}
            {selectedSecondaryDiagnoses && selectedSecondaryDiagnoses.length ? (
              <>
                {selectedSecondaryDiagnoses.map((diagnosis, index) => (
                  <Tag
                    className={styles.tag}
                    filter
                    key={index}
                    onClose={() => handleRemoveDiagnosis(diagnosis, 'secondaryInputSearch')}
                    type="blue"
                  >
                    {diagnosis.display}
                  </Tag>
                ))}
              </>
            ) : null}
            {selectedPrimaryDiagnoses &&
              !selectedPrimaryDiagnoses.length &&
              selectedSecondaryDiagnoses &&
              !selectedSecondaryDiagnoses.length && (
                <span>{t('emptyDiagnosisText', 'No diagnosis selected — Enter a diagnosis below')}</span>
              )}
          </div>
          <Row className={styles.row}>
            <Column sm={1}>
              <span className={styles.columnLabel}>{t('primaryDiagnosis', 'Primary diagnosis')}</span>
            </Column>
            <Column sm={3}>
              <FormGroup legendText={t('searchForPrimaryDiagnosis', 'Search for a primary diagnosis')}>
                <DiagnosisSearch
                  name="primaryDiagnosisSearch"
                  control={control}
                  labelText={t('enterPrimaryDiagnoses', 'Enter Primary diagnoses')}
                  placeholder={t('primaryDiagnosisInputPlaceholder', 'Choose a primary diagnosis')}
                  handleSearch={handleSearch}
                  error={errors?.primaryDiagnosisSearch}
                  setIsSearching={setIsSearching}
                />
                {error ? (
                  <InlineNotification
                    className={styles.errorNotification}
                    lowContrast
                    title={t('error', 'Error')}
                    subtitle={t('errorFetchingConcepts', 'There was a problem fetching concepts') + '.'}
                    onClose={() => setError(null)}
                  />
                ) : null}
                <DiagnosesDisplay
                  fieldName={'primaryDiagnosisSearch'}
                  isDiagnosisNotSelected={isDiagnosisNotSelected}
                  isLoading={isLoadingPrimaryDiagnoses}
                  isSearching={isSearching}
                  onAddDiagnosis={handleAddDiagnosis}
                  searchResults={searchPrimaryResults}
                  t={t}
                  value={watch('primaryDiagnosisSearch')}
                />
              </FormGroup>
            </Column>
          </Row>
          <Row className={styles.row}>
            <Column sm={1}>
              <span className={styles.columnLabel}>{t('secondaryDiagnosis', 'Secondary diagnosis')}</span>
            </Column>
            <Column sm={3}>
              <FormGroup legendText={t('searchForSecondaryDiagnosis', 'Search for a secondary diagnosis')}>
                <DiagnosisSearch
                  name="secondaryDiagnosisSearch"
                  control={control}
                  labelText={t('enterSecondaryDiagnoses', 'Enter Secondary diagnoses')}
                  placeholder={t('secondaryDiagnosisInputPlaceholder', 'Choose a secondary diagnosis')}
                  handleSearch={handleSearch}
                  setIsSearching={setIsSearching}
                />
                {error ? (
                  <InlineNotification
                    className={styles.errorNotification}
                    lowContrast
                    title={t('error', 'Error')}
                    subtitle={t('errorFetchingConcepts', 'There was a problem fetching concepts') + '.'}
                    onClose={() => setError(null)}
                  />
                ) : null}
                <DiagnosesDisplay
                  fieldName={'secondaryDiagnosisSearch'}
                  isDiagnosisNotSelected={isDiagnosisNotSelected}
                  isLoading={isLoadingSecondaryDiagnoses}
                  isSearching={isSearching}
                  onAddDiagnosis={handleAddDiagnosis}
                  searchResults={searchSecondaryResults}
                  t={t}
                  value={watch('secondaryDiagnosisSearch')}
                />
              </FormGroup>
            </Column>
          </Row>
          <Row className={styles.row}>
            <Column sm={1}>
              <span className={styles.columnLabel}>{t('note', 'Note')}</span>
            </Column>
            <Column sm={3}>
              <Controller
                name="clinicalNote"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <ResponsiveWrapper>
                    <TextArea
                      id="additionalNote"
                      rows={rows}
                      labelText={t('clinicalNoteLabel', 'Write your notes')}
                      placeholder={t('clinicalNotePlaceholder', 'Write any notes here')}
                      value={value}
                      onBlur={onBlur}
                      onChange={(event) => {
                        onChange(event);
                        const textareaLineHeight = 24; // This is the default line height for Carbon's TextArea component
                        const newRows = Math.ceil(event.target.scrollHeight / textareaLineHeight);
                        setRows(newRows);
                      }}
                    />
                  </ResponsiveWrapper>
                )}
              />
            </Column>
          </Row>
          <Row className={styles.row}>
            <Column sm={1}>
              <span className={styles.columnLabel}>{t('image', 'Image')}</span>
            </Column>
            <Column sm={3}>
              <FormGroup legendText="">
                <p className={styles.imgUploadHelperText}>
                  {t('imageUploadHelperText', "Upload images or use this device's camera to capture images")}
                </p>
                <Button
                  className={styles.uploadButton}
                  kind={isTablet ? 'ghost' : 'tertiary'}
                  onClick={showImageCaptureModal}
                  renderIcon={(props) => <Add size={16} {...props} />}
                >
                  {t('addImage', 'Add image')}
                </Button>
                <div className={styles.imgThumbnailGrid}>
                  {currentImages?.map((image, index) => (
                    <div key={index} className={styles.imgThumbnailItem}>
                      <div className={styles.imgThumbnailContainer}>
                        <img
                          className={styles.imgThumbnail}
                          src={image.base64Content}
                          alt={image.fileDescription ?? image.fileName}
                        />
                      </div>
                      <Button kind="ghost" className={styles.removeButton} onClick={() => handleRemoveImage(index)}>
                        <CloseFilled size={16} className={styles.closeIcon} />
                      </Button>
                    </div>
                  ))}
                </div>
              </FormGroup>
            </Column>
          </Row>
        </Stack>
      </div>
      <ButtonSet className={classnames({ [styles.tablet]: isTablet, [styles.desktop]: !isTablet })}>
        <Button className={styles.button} kind="secondary" onClick={() => closeWorkspace()}>
          {t('discard', 'Discard')}
        </Button>
        <Button
          className={styles.button}
          kind="primary"
          onClick={() => handleSubmit}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <InlineLoading description={t('saving', 'Saving') + '...'} />
          ) : (
            <span>{t('saveAndClose', 'Save and close')}</span>
          )}
        </Button>
      </ButtonSet>
    </Form>
  );
};

function DiagnosisSearch({
  name,
  control,
  labelText,
  placeholder,
  handleSearch,
  error,
  setIsSearching,
}: DiagnosisSearchProps) {
  const isTablet = useLayoutType() === 'tablet';
  const inputRef = useRef(null);

  const searchInputFocus = () => {
    inputRef.current.focus();
  };

  useEffect(() => {
    if (error) {
      searchInputFocus();
    }
  }, [error]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange, onBlur }, fieldState }) => (
        <>
          <ResponsiveWrapper>
            <Search
              ref={inputRef}
              size={isTablet ? 'lg' : 'md'}
              id={name}
              labelText={labelText}
              className={error && styles.diagnoserrorOutline}
              placeholder={placeholder}
              renderIcon={error && ((props) => <WarningFilled fill="red" {...props} />)}
              onChange={(e) => {
                setIsSearching(true);
                onChange(e);
                handleSearch(name);
              }}
              value={value instanceof Date ? value.toISOString() : value}
              onBlur={onBlur}
            />
          </ResponsiveWrapper>
          {fieldState?.error?.message && <p className={styles.errorMessage}>{fieldState?.error?.message}</p>}
        </>
      )}
    />
  );
}

function DiagnosesDisplay({
  fieldName,
  isDiagnosisNotSelected,
  isLoading,
  isSearching,
  onAddDiagnosis,
  searchResults,
  t,
  value,
}: DiagnosesDisplayProps) {
  if (!value) {
    return null;
  }

  if (isSearching || isLoading) {
    return <Loader />;
  }

  if (!isSearching && searchResults?.length > 0) {
    return (
      <ul className={styles.diagnosisList}>
        {searchResults.map((diagnosis, index) => {
          if (isDiagnosisNotSelected(diagnosis)) {
            return (
              <li
                className={styles.diagnosis}
                key={index}
                onClick={() => onAddDiagnosis(diagnosis, fieldName)}
                role="menuitem"
              >
                {diagnosis.display}
              </li>
            );
          }
        })}
      </ul>
    );
  }

  if (searchResults?.length === 0) {
    return (
      <ResponsiveWrapper>
        <Tile className={styles.emptyResults}>
          <span>
            {t('noMatchingDiagnoses', 'No diagnoses found matching')} <strong>"{value}"</strong>
          </span>
        </Tile>
      </ResponsiveWrapper>
    );
  }
}

function Loader() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonText key={index} className={styles.skeleton} />
      ))}
    </>
  );
}

export default VisitNotesForm;
