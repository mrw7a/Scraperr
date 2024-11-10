"use client";

import React, { useEffect, useState, Dispatch } from "react";
import { Element } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { RawJobOptions } from "@/types/job";
import { parseJobOptions, validateURL } from "@/lib";
import { JobSubmitterHeader } from "./job-submitter-header";
import { JobSubmitterInput } from "./job-submitter-input";
import { JobSubmitterOptions } from "./job-submitter-options";
import { ApiService } from "@/services";

interface StateProps {
  submittedURL: string;
  setSubmittedURL: Dispatch<React.SetStateAction<string>>;
  rows: Element[];
  isValidURL: boolean;
  setIsValidUrl: Dispatch<React.SetStateAction<boolean>>;
  setSnackbarMessage: Dispatch<React.SetStateAction<string>>;
  setSnackbarOpen: Dispatch<React.SetStateAction<boolean>>;
  setSnackbarSeverity: Dispatch<React.SetStateAction<string>>;
}

interface Props {
  stateProps: StateProps;
}

const initialJobOptions: RawJobOptions = {
  multi_page_scrape: false,
  custom_headers: null,
  proxies: null,
};

export const JobSubmitter = ({ stateProps }: Props) => {
  const { user } = useAuth();
  const router = useRouter();
  const { job_options } = router.query;

  const {
    submittedURL,
    rows,
    setIsValidUrl,
    setSnackbarMessage,
    setSnackbarOpen,
    setSnackbarSeverity,
  } = stateProps;

  const [urlError, setUrlError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [jobOptions, setJobOptions] =
    useState<RawJobOptions>(initialJobOptions);
  const [customJSONSelected, setCustomJSONSelected] = useState<boolean>(false);
  const [proxiesSelected, setProxiesSelected] = useState<boolean>(false);

  const handleSelectProxies = () => {
    setProxiesSelected(!proxiesSelected);
  };

  const handleSubmit = async () => {
    if (!validateURL(submittedURL)) {
      setIsValidUrl(false);
      setUrlError("Please enter a valid URL.");
      return;
    }

    setIsValidUrl(true);
    setUrlError(null);
    setLoading(true);

    let customHeaders;

    try {
      customHeaders = jobOptions.custom_headers
        ? JSON.parse(jobOptions.custom_headers)
        : null;
    } catch (error) {
      setSnackbarMessage("Invalid JSON in custom headers.");
      setSnackbarOpen(true);
      setSnackbarSeverity("error");
      setLoading(false);
      return;
    }

    await ApiService.submitJob(
      submittedURL,
      rows,
      user,
      jobOptions,
      customHeaders
    )
      .then(async (response) => {
        if (!response.ok) {
          return response.json().then((error) => {
            throw new Error(error.error);
          });
        }
        return response.json();
      })
      .then((data) => {
        setSnackbarMessage(
          `Job: ${data.id} submitted successfully.` ||
            "Job submitted successfully."
        );
        setSnackbarSeverity("info");
        setSnackbarOpen(true);
      })
      .catch((error) => {
        setSnackbarMessage(error || "An error occurred.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      })
      .finally(() => setLoading(false));
  };

  // Parse the job options from the query string
  useEffect(() => {
    if (job_options) {
      parseJobOptions(
        job_options as string,
        setCustomJSONSelected,
        setProxiesSelected,
        setJobOptions
      );
    }
  }, [job_options]);

  return (
    <>
      <div>
        <JobSubmitterHeader />
        <JobSubmitterInput
          {...stateProps}
          urlError={urlError}
          handleSubmit={handleSubmit}
          loading={loading}
        />
        <JobSubmitterOptions
          {...stateProps}
          jobOptions={jobOptions}
          setJobOptions={setJobOptions}
          customJSONSelected={customJSONSelected}
          setCustomJSONSelected={setCustomJSONSelected}
          handleSelectProxies={handleSelectProxies}
          proxiesSelected={proxiesSelected}
        />
      </div>
    </>
  );
};
