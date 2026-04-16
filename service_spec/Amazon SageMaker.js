/**
 * Amazon SageMaker - AWS Pricing Calculator Script
 *
 * Service name  : Amazon SageMaker
 * Configure URL : https://calculator.aws/#/addService (resolved at runtime)
 *
 * Usage (AI agent):
 *   await page.evaluate(fs.readFileSync('Amazon SageMaker.js', 'utf8'));
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAmazonSageMaker(params) {

  const config = {
    // Description - optional | PRICING IMPACT: false
    description: params?.description ?? 'SMB SageMaker baseline',

    // Choose a location type | PRICING IMPACT: true
    locationType: params?.locationType ?? 'Region',

    // Choose a Region | PRICING IMPACT: true
    region: params?.region ?? 'US East (N. Virginia)',

    // SageMaker Studio Notebooks | PRICING IMPACT: true
    enableSageMakerStudioNotebooks: params?.enableSageMakerStudioNotebooks ?? false,
    // Number of data scientist(s) Enter the number of data scientist(s) per month | PRICING IMPACT: true
    studioNotebookDataScientists: params?.studioNotebookDataScientists ?? 1,
    // Number of Studio Notebook instances per data scientist Enter the number of Studio Notebook instances per data scientist per month | PRICING IMPACT: true
    studioNotebookInstancesPerDataScientist: params?.studioNotebookInstancesPerDataScientist ?? 1,
    // Studio Notebook hour(s) per day Enter the number of hours Studio Notebooks are used per day | PRICING IMPACT: true
    studioNotebookHoursPerDay: params?.studioNotebookHoursPerDay ?? 4,
    // Studio Notebook day(s) per month Enter the number of days Studio Notebooks are used per month | PRICING IMPACT: true
    studioNotebookDaysPerMonth: params?.studioNotebookDaysPerMonth ?? 20,
    // Select an instance | PRICING IMPACT: true
    studioNotebookInstanceType: params?.studioNotebookInstanceType ?? 'ml.c5.12xlarge',

    // SageMaker Code Editor | PRICING IMPACT: true
    enableSageMakerCodeEditor: params?.enableSageMakerCodeEditor ?? false,
    // Number of data scientist(s)/ ML engineer(s) Enter the number of data scientist(s) per month | PRICING IMPACT: true
    codeEditorDataScientists: params?.codeEditorDataScientists ?? 1,
    // Number of Code editor private spaces per data scientist/ ML engineer Enter the number of Code editor private spaces per data scientist/ ML engineer per month | PRICING IMPACT: true
    codeEditorPrivateSpacesPerDataScientist: params?.codeEditorPrivateSpacesPerDataScientist ?? 1,
    // Number of Code Editor IDE usage hours per day Enter the number of Code Editor IDE usage hours per day | PRICING IMPACT: true
    codeEditorHoursPerDay: params?.codeEditorHoursPerDay ?? 4,
    // Code Editor day(s) per month Enter the number of days Code Editot IDE are used per month | PRICING IMPACT: true
    codeEditorDaysPerMonth: params?.codeEditorDaysPerMonth ?? 20,
    // Select an instance | PRICING IMPACT: true
    codeEditorInstanceType: params?.codeEditorInstanceType ?? 'ml.c5.12xlarge',

    // RStudio on SageMaker | PRICING IMPACT: true
    enableRStudioOnSageMaker: params?.enableRStudioOnSageMaker ?? false,
    // Number of data scientist(s) Enter the number of data scientist(s) per month | PRICING IMPACT: true
    rStudioDataScientists: params?.rStudioDataScientists ?? 1,
    // Number of RStudio Session instances per data scientist Enter the number of RStudio Session instances per data scientist per month | PRICING IMPACT: true
    rStudioSessionInstancesPerDataScientist: params?.rStudioSessionInstancesPerDataScientist ?? 1,
    // RStudio Session hour(s) per day Enter the number of hours RStudio Session are used per day | PRICING IMPACT: true
    rStudioHoursPerDay: params?.rStudioHoursPerDay ?? 4,
    // RStudio Session day(s) per month Enter the number of days RStudio Session are used per month | PRICING IMPACT: true
    rStudioDaysPerMonth: params?.rStudioDaysPerMonth ?? 20,
    // Select an instance | PRICING IMPACT: true
    rStudioStudioInstanceType: params?.rStudioStudioInstanceType ?? 'ml.c5.12xlarge',
    // Select an instance | PRICING IMPACT: true
    rStudioSessionInstanceType: params?.rStudioSessionInstanceType ?? 'ml.c5.4xlarge',

    // SageMaker On-Demand Notebook Instances | PRICING IMPACT: true
    enableSageMakerOnDemandNotebookInstances: params?.enableSageMakerOnDemandNotebookInstances ?? false,
    // Number of data scientist(s) Enter the number of data scientist(s) per month | PRICING IMPACT: true
    onDemandNotebookDataScientists: params?.onDemandNotebookDataScientists ?? 1,
    // Number of On-Demand Notebook instances per data scientist Enter the number of On-Demand Notebook instances per data scientist per month | PRICING IMPACT: true
    onDemandNotebookInstancesPerDataScientist: params?.onDemandNotebookInstancesPerDataScientist ?? 1,
    // On-Demand Notebook hour(s) per day Enter the number of hours On-Demand Notebook is used per day | PRICING IMPACT: true
    onDemandNotebookHoursPerDay: params?.onDemandNotebookHoursPerDay ?? 4,
    // On-Demand Notebook day(s) per month Enter the number of days On-Demand Notebook is used per month | PRICING IMPACT: true
    onDemandNotebookDaysPerMonth: params?.onDemandNotebookDaysPerMonth ?? 20,
    // Select an instance | PRICING IMPACT: true
    onDemandNotebookInstanceType: params?.onDemandNotebookInstanceType ?? 'ml.c4.2xlarge',

    // SageMaker Processing | PRICING IMPACT: true
    enableSageMakerProcessing: params?.enableSageMakerProcessing ?? false,
    // Number of processing jobs per month Enter the number of processing jobs per month | PRICING IMPACT: true
    processingJobsPerMonth: params?.processingJobsPerMonth ?? 1,
    // Number of instances per job Enter the number of instances per job | PRICING IMPACT: true
    processingInstancesPerJob: params?.processingInstancesPerJob ?? 1,
    // Hour(s) per instance per job Enter the number of hours per instance per job | PRICING IMPACT: true
    processingHoursPerInstancePerJob: params?.processingHoursPerInstancePerJob ?? 1,
    // Select an instance | PRICING IMPACT: true
    processingInstanceType: params?.processingInstanceType ?? 'ml.c4.2xlarge',
    // Storage | PRICING IMPACT: true
    processingStorageType: params?.processingStorageType ?? 'General Purpose SSD (gp2)',
    // Storage amount Value | PRICING IMPACT: true
    processingStorageAmount: params?.processingStorageAmount ?? 100,
    // Unit | PRICING IMPACT: true
    processingStorageUnit: params?.processingStorageUnit ?? 'GB per month',

    // SageMaker Data Wrangler | PRICING IMPACT: true
    enableSageMakerDataWrangler: params?.enableSageMakerDataWrangler ?? false,
    // Number of data scientist(s) Enter the number of data scientist(s) per month | PRICING IMPACT: true
    dataWranglerDataScientists: params?.dataWranglerDataScientists ?? 1,
    // Data Wrangler hour(s) per day Enter the number of hours Data Wrangler instances are used per day | PRICING IMPACT: true
    dataWranglerHoursPerDay: params?.dataWranglerHoursPerDay ?? 4,
    // Data Wrangler day(s) per month Enter the number of days Data Wrangler instances are used per month | PRICING IMPACT: true
    dataWranglerDaysPerMonth: params?.dataWranglerDaysPerMonth ?? 20,
    // Select an instance | PRICING IMPACT: true
    dataWranglerInstanceType: params?.dataWranglerInstanceType ?? 'ml.m5.16xlarge',
    // Number of data wrangler jobs per month Enter the number of data wrangler jobs per month | PRICING IMPACT: true
    dataWranglerJobsPerMonth: params?.dataWranglerJobsPerMonth ?? 1,
    // Number of instances per job Enter the number of instances per job | PRICING IMPACT: true
    dataWranglerInstancesPerJob: params?.dataWranglerInstancesPerJob ?? 1,
    // Hour(s) per instance per job Enter the number of hours per instance per job | PRICING IMPACT: true
    dataWranglerHoursPerInstancePerJob: params?.dataWranglerHoursPerInstancePerJob ?? 1,
    // Select an instance | PRICING IMPACT: true
    dataWranglerJobsInstanceType: params?.dataWranglerJobsInstanceType ?? 'ml.m5.12xlarge',
    // Storage | PRICING IMPACT: true
    dataWranglerStorageType: params?.dataWranglerStorageType ?? 'General Purpose SSD (gp2)',
    // Storage amount Value | PRICING IMPACT: true
    dataWranglerStorageAmount: params?.dataWranglerStorageAmount ?? 100,
    // Unit | PRICING IMPACT: true
    dataWranglerStorageUnit: params?.dataWranglerStorageUnit ?? 'GB per month',

    // SageMaker Feature Store | PRICING IMPACT: true
    enableSageMakerFeatureStore: params?.enableSageMakerFeatureStore ?? false,
    // Data storage size Value | PRICING IMPACT: true
    featureStoreStandardDataStorageAmount: params?.featureStoreStandardDataStorageAmount ?? 1,
    // GB | PRICING IMPACT: true
    featureStoreStandardDataStorageUnit: params?.featureStoreStandardDataStorageUnit ?? 'GB',
    // Average record size Value | PRICING IMPACT: true
    featureStoreStandardAverageRecordSize: params?.featureStoreStandardAverageRecordSize ?? 1,
    // KB | PRICING IMPACT: true
    featureStoreStandardAverageRecordSizeUnit: params?.featureStoreStandardAverageRecordSizeUnit ?? 'KB',
    // Number of writes Value | PRICING IMPACT: true
    featureStoreStandardWriteRequests: params?.featureStoreStandardWriteRequests ?? 1,
    // million per month | PRICING IMPACT: true
    featureStoreStandardWriteRequestsUnit: params?.featureStoreStandardWriteRequestsUnit ?? 'million per month',
    // Number of reads Value | PRICING IMPACT: true
    featureStoreStandardReadRequests: params?.featureStoreStandardReadRequests ?? 1,
    // million per month | PRICING IMPACT: true
    featureStoreStandardReadRequestsUnit: params?.featureStoreStandardReadRequestsUnit ?? 'million per month',
    // Write rate Value | PRICING IMPACT: true
    featureStoreStandardWriteRate: params?.featureStoreStandardWriteRate ?? 1,
    // per second | PRICING IMPACT: true
    featureStoreStandardWriteRateUnit: params?.featureStoreStandardWriteRateUnit ?? 'per second',
    // Read rate Value | PRICING IMPACT: true
    featureStoreStandardReadRate: params?.featureStoreStandardReadRate ?? 1,
    // per second | PRICING IMPACT: true
    featureStoreStandardReadRateUnit: params?.featureStoreStandardReadRateUnit ?? 'per second',
    // Data storage size Value | PRICING IMPACT: true
    featureStoreInMemoryDataStorageAmount: params?.featureStoreInMemoryDataStorageAmount ?? 1,
    // GB | PRICING IMPACT: true
    featureStoreInMemoryDataStorageUnit: params?.featureStoreInMemoryDataStorageUnit ?? 'GB',
    // Average record size Value | PRICING IMPACT: true
    featureStoreInMemoryAverageRecordSize: params?.featureStoreInMemoryAverageRecordSize ?? 1,
    // KB | PRICING IMPACT: true
    featureStoreInMemoryAverageRecordSizeUnit: params?.featureStoreInMemoryAverageRecordSizeUnit ?? 'KB',
    // Number of writes Value | PRICING IMPACT: true
    featureStoreInMemoryWriteRequests: params?.featureStoreInMemoryWriteRequests ?? 1,
    // million per month | PRICING IMPACT: true
    featureStoreInMemoryWriteRequestsUnit: params?.featureStoreInMemoryWriteRequestsUnit ?? 'million per month',
    // Number of reads Value | PRICING IMPACT: true
    featureStoreInMemoryReadRequests: params?.featureStoreInMemoryReadRequests ?? 1,
    // million per month | PRICING IMPACT: true
    featureStoreInMemoryReadRequestsUnit: params?.featureStoreInMemoryReadRequestsUnit ?? 'million per month',
    // Data transfer from | PRICING IMPACT: true
    featureStoreInboundDataTransferFrom: params?.featureStoreInboundDataTransferFrom ?? 'Internet (free)',
    // Enter Amount Enter amount | PRICING IMPACT: true
    featureStoreInboundDataTransferAmount: params?.featureStoreInboundDataTransferAmount ?? 1,
    // TB per month | PRICING IMPACT: true
    featureStoreInboundDataTransferUnit: params?.featureStoreInboundDataTransferUnit ?? 'TB per month',
    // Data transfer to | PRICING IMPACT: true
    featureStoreOutboundDataTransferTo: params?.featureStoreOutboundDataTransferTo ?? 'All other regions (0.02 USD per GB)',
    // Enter Amount Enter amount | PRICING IMPACT: true
    featureStoreOutboundDataTransferAmount: params?.featureStoreOutboundDataTransferAmount ?? 1,
    // TB per month | PRICING IMPACT: true
    featureStoreOutboundDataTransferUnit: params?.featureStoreOutboundDataTransferUnit ?? 'TB per month',

    // SageMaker Training | PRICING IMPACT: true
    enableSageMakerTraining: params?.enableSageMakerTraining ?? false,
    // Number of training jobs per month Enter the number of training jobs per month | PRICING IMPACT: true
    trainingJobsPerMonth: params?.trainingJobsPerMonth ?? 1,
    // Number of instances per job Enter the number of instances per job | PRICING IMPACT: true
    trainingInstancesPerJob: params?.trainingInstancesPerJob ?? 1,
    // Hour(s) per instance per job Enter the number of hours per instance per job | PRICING IMPACT: true
    trainingHoursPerInstancePerJob: params?.trainingHoursPerInstancePerJob ?? 1,
    // Select an instance | PRICING IMPACT: true
    trainingInstanceType: params?.trainingInstanceType ?? 'ml.c4.2xlarge',
    // Storage | PRICING IMPACT: true
    trainingStorageType: params?.trainingStorageType ?? 'General Purpose SSD (gp2)',
    // Storage amount Value | PRICING IMPACT: true
    trainingStorageAmount: params?.trainingStorageAmount ?? 100,
    // Unit | PRICING IMPACT: true
    trainingStorageUnit: params?.trainingStorageUnit ?? 'GB per month',

    // SageMaker Real-Time Inference | PRICING IMPACT: true
    enableSageMakerRealTimeInference: params?.enableSageMakerRealTimeInference ?? false,
    // Number of models deployed Enter the number of models deployed | PRICING IMPACT: true
    realTimeModelsDeployed: params?.realTimeModelsDeployed ?? 1,
    // Number of models per endpoint Enter the number of models per endpoint | PRICING IMPACT: true
    realTimeModelsPerEndpoint: params?.realTimeModelsPerEndpoint ?? 1,
    // Number of instances per endpoint Enter the number of instances per endpoint | PRICING IMPACT: true
    realTimeInstancesPerEndpoint: params?.realTimeInstancesPerEndpoint ?? 1,
    // Endpoint hour(s) per day Enter the number of hours endpoint is active per day | PRICING IMPACT: true
    realTimeHoursPerDay: params?.realTimeHoursPerDay ?? 24,
    // Endpoint day(s) per month Enter the number of days endpoint is active per month | PRICING IMPACT: true
    realTimeDaysPerMonth: params?.realTimeDaysPerMonth ?? 30,
    // Select an instance | PRICING IMPACT: true
    realTimeInstanceType: params?.realTimeInstanceType ?? 'ml.c4.2xlarge',
    // Add Elastic Inference Accelerator instances No | PRICING IMPACT: true
    enableElasticInferenceAcceleratorInstances: params?.enableElasticInferenceAcceleratorInstances ?? false,
    // Elastic Inference Instance ml.eia1.large | PRICING IMPACT: true
    elasticInferenceInstance: params?.elasticInferenceInstance ?? 'ml.eia1.large',
    // Number of Model Monitor jobs per month Enter the number of Model Monitor jobs per month | PRICING IMPACT: true
    realTimeModelMonitorJobsPerMonth: params?.realTimeModelMonitorJobsPerMonth ?? 1,
    // Number of Model Monitor instances per job Enter the number of Model Monitor instances per job | PRICING IMPACT: true
    realTimeModelMonitorInstancesPerJob: params?.realTimeModelMonitorInstancesPerJob ?? 1,
    // Hour(s) per Model Monitor instance per job Enter the number of hours per Model Monitor instance per job | PRICING IMPACT: true
    realTimeModelMonitorHoursPerJob: params?.realTimeModelMonitorHoursPerJob ?? 1,
    // Select an instance | PRICING IMPACT: true
    realTimeModelMonitorInstanceType: params?.realTimeModelMonitorInstanceType ?? 'ml.c4.2xlarge',
    // Storage | PRICING IMPACT: true
    realTimeStorageType: params?.realTimeStorageType ?? 'General Purpose SSD (gp2)',
    // Storage amount Value | PRICING IMPACT: true
    realTimeStorageAmount: params?.realTimeStorageAmount ?? 100,
    // Unit | PRICING IMPACT: true
    realTimeStorageUnit: params?.realTimeStorageUnit ?? 'GB per month',
    // Data Processed IN Value | PRICING IMPACT: true
    realTimeDataProcessedInAmount: params?.realTimeDataProcessedInAmount ?? 1,
    // GB | PRICING IMPACT: true
    realTimeDataProcessedInUnit: params?.realTimeDataProcessedInUnit ?? 'GB',
    // Data Processed OUT Value | PRICING IMPACT: true
    realTimeDataProcessedOutAmount: params?.realTimeDataProcessedOutAmount ?? 1,
    // GB | PRICING IMPACT: true
    realTimeDataProcessedOutUnit: params?.realTimeDataProcessedOutUnit ?? 'GB',

    // SageMaker Asynchronous Inference | PRICING IMPACT: true
    enableSageMakerAsynchronousInference: params?.enableSageMakerAsynchronousInference ?? false,
    // Number of models deployed Enter the number of models deployed | PRICING IMPACT: true
    asyncModelsDeployed: params?.asyncModelsDeployed ?? 1,
    // Number of models per endpoint Enter the number of models per endpoint | PRICING IMPACT: true
    asyncModelsPerEndpoint: params?.asyncModelsPerEndpoint ?? 1,
    // Number of instances per endpoint Enter the number of instances per endpoint | PRICING IMPACT: true
    asyncInstancesPerEndpoint: params?.asyncInstancesPerEndpoint ?? 1,
    // Endpoint hour(s) per day Enter the number of hours endpoint is active per day including cool down periods for autoscaling | PRICING IMPACT: true
    asyncHoursPerDay: params?.asyncHoursPerDay ?? 24,
    // Endpoint day(s) per month Enter the number of days endpoint is active per month | PRICING IMPACT: true
    asyncDaysPerMonth: params?.asyncDaysPerMonth ?? 30,
    // Select an instance | PRICING IMPACT: true
    asyncInstanceType: params?.asyncInstanceType ?? 'ml.c4.2xlarge',
    // Storage | PRICING IMPACT: true
    asyncStorageType: params?.asyncStorageType ?? 'General Purpose SSD (gp2)',
    // Storage amount Value | PRICING IMPACT: true
    asyncStorageAmount: params?.asyncStorageAmount ?? 100,
    // Unit | PRICING IMPACT: true
    asyncStorageUnit: params?.asyncStorageUnit ?? 'GB per month',
    // Data Processed IN Value | PRICING IMPACT: true
    asyncDataProcessedInAmount: params?.asyncDataProcessedInAmount ?? 1,
    // GB | PRICING IMPACT: true
    asyncDataProcessedInUnit: params?.asyncDataProcessedInUnit ?? 'GB',
    // Data Processed OUT Value | PRICING IMPACT: true
    asyncDataProcessedOutAmount: params?.asyncDataProcessedOutAmount ?? 1,
    // GB | PRICING IMPACT: true
    asyncDataProcessedOutUnit: params?.asyncDataProcessedOutUnit ?? 'GB',

    // SageMaker Batch Transform | PRICING IMPACT: true
    enableSageMakerBatchTransform: params?.enableSageMakerBatchTransform ?? false,
    // Number of Batch Transform jobs per month Enter the number of Batch Transform jobs per month | PRICING IMPACT: true
    batchTransformJobsPerMonth: params?.batchTransformJobsPerMonth ?? 1,
    // Number of instances per job Enter the number of instances per job | PRICING IMPACT: true
    batchTransformInstancesPerJob: params?.batchTransformInstancesPerJob ?? 1,
    // Hour(s) per instance per job Enter the number of hours per instance per job | PRICING IMPACT: true
    batchTransformHoursPerInstancePerJob: params?.batchTransformHoursPerInstancePerJob ?? 1,
    // Select an instance | PRICING IMPACT: true
    batchTransformInstanceType: params?.batchTransformInstanceType ?? 'ml.c4.2xlarge',

    // SageMaker Edge Manager | PRICING IMPACT: true
    enableSageMakerEdgeManager: params?.enableSageMakerEdgeManager ?? false,
    // Number of registered devices Enter number of registered devices | PRICING IMPACT: true
    edgeManagerRegisteredDevices: params?.edgeManagerRegisteredDevices ?? 1,
    // Number of managed models Enter number of managed models per month | PRICING IMPACT: true
    edgeManagerManagedModels: params?.edgeManagerManagedModels ?? 1,

    // SageMaker Serverless Inference | PRICING IMPACT: true
    enableSageMakerServerlessInference: params?.enableSageMakerServerlessInference ?? false,
    // millions | PRICING IMPACT: true
    serverlessRequestsUnit: params?.serverlessRequestsUnit ?? 'millions',
    // Number of request per month Enter number of requests in units selected | PRICING IMPACT: true
    serverlessRequestsPerMonth: params?.serverlessRequestsPerMonth ?? 1,
    // Duration of each request (ms) Enter the duration of each request (ms) | PRICING IMPACT: true
    serverlessRequestDurationMs: params?.serverlessRequestDurationMs ?? 100,
    // 1024 | PRICING IMPACT: true
    serverlessMemoryMb: params?.serverlessMemoryMb ?? '1024',
    // Provisioned Concurrency value Enter number of requests in units selected | PRICING IMPACT: true
    serverlessProvisionedConcurrencyRequests: params?.serverlessProvisionedConcurrencyRequests ?? 1,
    // Time for which Provisioned Concurrency is enabled Value | PRICING IMPACT: true
    serverlessProvisionedConcurrencyHours: params?.serverlessProvisionedConcurrencyHours ?? 1,
    // hours | PRICING IMPACT: true
    serverlessProvisionedConcurrencyHoursUnit: params?.serverlessProvisionedConcurrencyHoursUnit ?? 'hours',
    // Number of requests for Provisioned Concurrency per month Enter number of requests in units selected | PRICING IMPACT: true
    serverlessProvisionedRequestsPerMonth: params?.serverlessProvisionedRequestsPerMonth ?? 1,
    // Duration of each request (ms) Enter the duration of each request (ms) | PRICING IMPACT: true
    serverlessProvisionedRequestDurationMs: params?.serverlessProvisionedRequestDurationMs ?? 100,
    // 1024 | PRICING IMPACT: true
    serverlessProvisionedMemoryMb: params?.serverlessProvisionedMemoryMb ?? '1024',
    // Data Processed IN Value | PRICING IMPACT: true
    serverlessDataProcessedInAmount: params?.serverlessDataProcessedInAmount ?? 1,
    // GB | PRICING IMPACT: true
    serverlessDataProcessedInUnit: params?.serverlessDataProcessedInUnit ?? 'GB',
    // Data Processed OUT Value | PRICING IMPACT: true
    serverlessDataProcessedOutAmount: params?.serverlessDataProcessedOutAmount ?? 1,
    // GB | PRICING IMPACT: true
    serverlessDataProcessedOutUnit: params?.serverlessDataProcessedOutUnit ?? 'GB',

    // SageMaker Autopilot | PRICING IMPACT: true
    enableSageMakerAutopilot: params?.enableSageMakerAutopilot ?? false,
    // Number of Autopilot Jobs per month Enter Number of Autopilot Jobs per month | PRICING IMPACT: true
    autopilotJobsPerMonth: params?.autopilotJobsPerMonth ?? 1,
    // Number of training hours per Autopilot job Enter Number of training hours per autopilot job | PRICING IMPACT: true
    autopilotTrainingHoursPerJob: params?.autopilotTrainingHoursPerJob ?? 1,

    // SageMaker MLflow | PRICING IMPACT: true
    enableSageMakerMLflow: params?.enableSageMakerMLflow ?? false
  };

  console.log('[Amazon SageMaker] Starting with config:', config);

  function jitter(min = 80, max = 350) {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function scrollTo(el) {
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function normalizeText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function isVisible(el) {
    return !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function setDomValue(el, value) {
    if (!el) {
      return;
    }
    scrollTo(el);
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function getFieldText(el) {
    const ariaLabel = normalizeText(el.getAttribute('aria-label'));
    if (ariaLabel) {
      return ariaLabel;
    }
    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      return normalizeText(
        ariaLabelledBy
          .split(/\s+/)
          .map(id => document.getElementById(id)?.textContent || '')
          .join(' ')
      );
    }
    return normalizeText(el.textContent);
  }

  function getFeatureWrapper(featureLabel) {
    const heading = [...document.querySelectorAll('h2')].find(el => {
      const text = normalizeText(el.textContent);
      return text === `${featureLabel} feature` || text === featureLabel;
    });
    return heading?.parentElement?.parentElement?.parentElement || null;
  }

  function getVisibleFields(root) {
    if (!root) {
      return [];
    }
    return [...root.querySelectorAll('input, textarea, button, input[role="combobox"]')]
      .filter(isVisible);
  }

  function findField(root, labelText, occurrence = 0, kind = 'any') {
    const candidates = getVisibleFields(root).filter(el => {
      if (kind === 'input') {
        return el.matches('input:not([role="combobox"]), textarea');
      }
      if (kind === 'select') {
        return el.matches('button[aria-haspopup="listbox"]');
      }
      if (kind === 'combobox') {
        return el.matches('input[role="combobox"]');
      }
      return true;
    });

    if (kind === 'combobox') {
      return candidates[occurrence] || null;
    }

    const matches = candidates.filter(el => {
      const text = normalizeText(getFieldText(el));
      const fallbackText = normalizeText(el.parentElement?.textContent || '');
      return text.includes(labelText) || fallbackText.includes(labelText) || normalizeText(el.textContent || '').includes(labelText);
    });

    return matches[occurrence] || null;
  }

  async function waitForElement(selector, timeout = 12000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const el = document.querySelector(selector);
      if (el) {
        return el;
      }
      await wait(300);
    }
    console.warn('[Amazon SageMaker] waitForElement timed out:', selector);
    return null;
  }

  async function clickOptionMatching(value, root = document) {
    const desired = normalizeText(value);
    const options = [...root.querySelectorAll('[role="option"], button, [role="radio"], [role="menuitem"]')].filter(isVisible);
    const option = options.find(el => normalizeText(el.textContent).includes(desired));
    if (!option) {
      console.warn('[Amazon SageMaker] Field not found:', desired);
      return false;
    }
    scrollTo(option);
    await jitter();
    option.click();
    await wait(300);
    return true;
  }

  async function setInputField(root, labelText, value, occurrence = 0) {
    const field = findField(root, labelText, occurrence, 'input');
    if (!field) {
      console.warn('[Amazon SageMaker] Field not found:', labelText);
      return;
    }
    await jitter();
    setDomValue(field, value);
    await jitter(100, 300);
  }

  async function setDropdownField(root, labelText, value, occurrence = 0) {
    const field = findField(root, labelText, occurrence, 'select');
    if (!field) {
      console.warn('[Amazon SageMaker] Field not found:', labelText);
      return;
    }
    const currentText = normalizeText(field.textContent);
    if (currentText && currentText.includes(normalizeText(value))) {
      return;
    }
    scrollTo(field);
    await jitter();
    field.click();
    await wait(600);
    const selected = await clickOptionMatching(value);
    if (!selected) {
      return;
    }
    await jitter(100, 300);
  }

  async function setBooleanDropdownField(root, labelText, desiredBoolean, occurrence = 0) {
    await setDropdownField(root, labelText, desiredBoolean ? 'Yes' : 'No', occurrence);
  }

  async function setComboboxField(root, value, occurrence = 0) {
    const field = findField(root, 'Select an instance', occurrence, 'combobox');
    if (!field) {
      console.warn('[Amazon SageMaker] Field not found:', 'Select an instance');
      return;
    }
    if (normalizeText(field.value) === normalizeText(value)) {
      return;
    }
    scrollTo(field);
    await jitter();
    field.click();
    await wait(250);
    field.focus();
    if (typeof field.select === 'function') {
      field.select();
    }
    const inserted = typeof document.execCommand === 'function'
      ? document.execCommand('insertText', false, String(value))
      : false;
    if (!inserted) {
      setDomValue(field, value);
    }

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    field.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    await wait(500);

    if (!normalizeText(field.value).includes(normalizeText(value))) {
      console.warn('[Amazon SageMaker] Field not found:', value);
      return;
    }

    await jitter(100, 300);
  }

  async function setToggle(labelText, desiredState) {
    const toggle = [...document.querySelectorAll('button[role="switch"], input[type="checkbox"]')]
      .find(el => {
        const label = el.getAttribute('aria-label') || getFieldText(el) || el.closest('label')?.textContent || el.closest('[class*="toggle"], [class*="switch"]')?.querySelector('span, label')?.textContent || '';
        return normalizeText(label).includes(labelText);
      });

    if (!toggle) {
      console.warn('[Amazon SageMaker] Toggle not found:', labelText);
      return;
    }

    const isOn = toggle.getAttribute('aria-checked') === 'true' || toggle.checked === true;
    if (isOn !== desiredState) {
      scrollTo(toggle);
      await jitter();
      toggle.click();
      await wait(desiredState ? 1500 : 800);
    }
  }

  async function fillFeature(feature, enabledKey, fields) {
    await setToggle(feature, !!config[enabledKey]);
    if (!config[enabledKey]) {
      return;
    }

    const root = getFeatureWrapper(feature);
    if (!root) {
      console.warn('[Amazon SageMaker] Field not found:', feature);
      return;
    }

    for (const field of fields) {
      if (field.kind === 'input') {
        await setInputField(root, field.label, config[field.key], field.occurrence || 0);
      } else if (field.kind === 'select') {
        await setDropdownField(root, field.label, config[field.key], field.occurrence || 0);
      } else if (field.kind === 'booleanSelect') {
        await setBooleanDropdownField(root, field.label, config[field.key], field.occurrence || 0);
      } else if (field.kind === 'combobox') {
        await setComboboxField(root, config[field.key], field.occurrence || 0);
      }
    }
  }

  const topLevelRoot = document;

  if (!window.location.hash.includes('/addService') && !window.location.hash.includes('/createCalculator/SageMaker')) {
    window.location.hash = '#/addService';
    await wait(2500);
  }

  if (window.location.hash.includes('/addService')) {
    const searchAllRadio = [...document.querySelectorAll('input[type="radio"]')]
      .find(radio => normalizeText(radio.closest('label, div')?.textContent || '').includes('Search all services'));
    if (searchAllRadio && !searchAllRadio.checked) {
      scrollTo(searchAllRadio);
      await jitter(200, 400);
      searchAllRadio.click();
      await wait(800);
    }

    const searchBox = await waitForElement('input[placeholder="Search for a service"], input[aria-label="Find Service"], input[role="searchbox"]');
    if (searchBox) {
      scrollTo(searchBox);
      await jitter(200, 500);
      setDomValue(searchBox, 'Amazon SageMaker');
      await wait(1800);
    }

    const configButton = [...document.querySelectorAll('button')]
      .find(button => normalizeText(button.textContent) === 'Configure' && normalizeText(button.closest('li, article')?.textContent || '').includes('Amazon SageMaker'));
    if (configButton) {
      scrollTo(configButton);
      await jitter(250, 600);
      configButton.click();
      await wait(5000);
    } else {
      console.warn('[Amazon SageMaker] Configure button not found');
      return;
    }
  }

  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setInputField(topLevelRoot, 'Description - optional', config.description);
  await setDropdownField(topLevelRoot, 'Choose a location type', config.locationType);

  // Region is the first matching listbox button in the current calculator DOM.
  await setDropdownField(topLevelRoot, 'Region', config.region, 0);

  await fillFeature('SageMaker Studio Notebooks', 'enableSageMakerStudioNotebooks', [
    { kind: 'input', label: 'Number of data scientist(s) Enter the number of data scientist(s) per month', key: 'studioNotebookDataScientists' },
    { kind: 'input', label: 'Number of Studio Notebook instances per data scientist Enter the number of Studio Notebook instances per data scientist per month', key: 'studioNotebookInstancesPerDataScientist' },
    { kind: 'input', label: 'Studio Notebook hour(s) per day Enter the number of hours Studio Notebooks are used per day', key: 'studioNotebookHoursPerDay' },
    { kind: 'input', label: 'Studio Notebook day(s) per month Enter the number of days Studio Notebooks are used per month', key: 'studioNotebookDaysPerMonth' },
    { kind: 'combobox', label: 'Select an instance', key: 'studioNotebookInstanceType', occurrence: 0 }
  ]);

  await fillFeature('SageMaker Code Editor', 'enableSageMakerCodeEditor', [
    { kind: 'input', label: 'Number of data scientist(s)/ ML engineer(s) Enter the number of data scientist(s) per month', key: 'codeEditorDataScientists' },
    { kind: 'input', label: 'Number of Code editor private spaces per data scientist/ ML engineer Enter the number of Code editor private spaces per data scientist/ ML engineer per month', key: 'codeEditorPrivateSpacesPerDataScientist' },
    { kind: 'input', label: 'Number of Code Editor IDE usage hours per day Enter the number of Code Editor IDE usage hours per day', key: 'codeEditorHoursPerDay' },
    { kind: 'input', label: 'Code Editor day(s) per month Enter the number of days Code Editot IDE are used per month', key: 'codeEditorDaysPerMonth' },
    { kind: 'combobox', label: 'Select an instance', key: 'codeEditorInstanceType', occurrence: 0 }
  ]);

  await fillFeature('RStudio on SageMaker', 'enableRStudioOnSageMaker', [
    { kind: 'input', label: 'Number of data scientist(s) Enter the number of data scientist(s) per month', key: 'rStudioDataScientists', occurrence: 0 },
    { kind: 'input', label: 'Number of RStudio Session instances per data scientist Enter the number of RStudio Session instances per data scientist per month', key: 'rStudioSessionInstancesPerDataScientist' },
    { kind: 'input', label: 'RStudio Session hour(s) per day Enter the number of hours RStudio Session are used per day', key: 'rStudioHoursPerDay' },
    { kind: 'input', label: 'RStudio Session day(s) per month Enter the number of days RStudio Session are used per month', key: 'rStudioDaysPerMonth' },
    { kind: 'combobox', label: 'Select an instance', key: 'rStudioStudioInstanceType', occurrence: 0 },
    { kind: 'combobox', label: 'Select an instance', key: 'rStudioSessionInstanceType', occurrence: 1 }
  ]);

  await fillFeature('SageMaker On-Demand Notebook Instances', 'enableSageMakerOnDemandNotebookInstances', [
    { kind: 'input', label: 'Number of data scientist(s) Enter the number of data scientist(s) per month', key: 'onDemandNotebookDataScientists', occurrence: 0 },
    { kind: 'input', label: 'Number of On-Demand Notebook instances per data scientist Enter the number of On-Demand Notebook instances per data scientist per month', key: 'onDemandNotebookInstancesPerDataScientist' },
    { kind: 'input', label: 'On-Demand Notebook hour(s) per day Enter the number of hours On-Demand Notebook is used per day', key: 'onDemandNotebookHoursPerDay' },
    { kind: 'input', label: 'On-Demand Notebook day(s) per month Enter the number of days On-Demand Notebook is used per month', key: 'onDemandNotebookDaysPerMonth' },
    { kind: 'combobox', label: 'Select an instance', key: 'onDemandNotebookInstanceType', occurrence: 0 }
  ]);

  await fillFeature('SageMaker Processing', 'enableSageMakerProcessing', [
    { kind: 'input', label: 'Number of processing jobs per month Enter the number of processing jobs per month', key: 'processingJobsPerMonth' },
    { kind: 'input', label: 'Number of instances per job Enter the number of instances per job', key: 'processingInstancesPerJob' },
    { kind: 'input', label: 'Hour(s) per instance per job Enter the number of hours per instance per job', key: 'processingHoursPerInstancePerJob' },
    { kind: 'combobox', label: 'Select an instance', key: 'processingInstanceType', occurrence: 0 },
    { kind: 'select', label: 'General Purpose SSD (gp2)', key: 'processingStorageType', occurrence: 0 },
    { kind: 'input', label: 'Storage amount Value', key: 'processingStorageAmount' },
    { kind: 'select', label: 'Unit', key: 'processingStorageUnit', occurrence: 0 }
  ]);

  await fillFeature('SageMaker Data Wrangler', 'enableSageMakerDataWrangler', [
    { kind: 'input', label: 'Number of data scientist(s) Enter the number of data scientist(s) per month', key: 'dataWranglerDataScientists', occurrence: 0 },
    { kind: 'input', label: 'Data Wrangler hour(s) per day Enter the number of hours Data Wrangler instances are used per day', key: 'dataWranglerHoursPerDay' },
    { kind: 'input', label: 'Data Wrangler day(s) per month Enter the number of days Data Wrangler instances are used per month', key: 'dataWranglerDaysPerMonth' },
    { kind: 'combobox', label: 'Select an instance', key: 'dataWranglerInstanceType', occurrence: 0 },
    { kind: 'input', label: 'Number of data wrangler jobs per month Enter the number of data wrangler jobs per month', key: 'dataWranglerJobsPerMonth' },
    { kind: 'input', label: 'Number of instances per job Enter the number of instances per job', key: 'dataWranglerInstancesPerJob' },
    { kind: 'input', label: 'Hour(s) per instance per job Enter the number of hours per instance per job', key: 'dataWranglerHoursPerInstancePerJob' },
    { kind: 'combobox', label: 'Select an instance', key: 'dataWranglerJobsInstanceType', occurrence: 1 },
    { kind: 'select', label: 'General Purpose SSD (gp2)', key: 'dataWranglerStorageType', occurrence: 0 },
    { kind: 'input', label: 'Storage amount Value', key: 'dataWranglerStorageAmount' },
    { kind: 'select', label: 'Unit', key: 'dataWranglerStorageUnit', occurrence: 0 }
  ]);

  await fillFeature('SageMaker Feature Store', 'enableSageMakerFeatureStore', [
    { kind: 'input', label: 'Data storage size Value', key: 'featureStoreStandardDataStorageAmount', occurrence: 0 },
    { kind: 'select', label: 'GB', key: 'featureStoreStandardDataStorageUnit', occurrence: 0 },
    { kind: 'input', label: 'Average record size Value', key: 'featureStoreStandardAverageRecordSize', occurrence: 0 },
    { kind: 'select', label: 'KB', key: 'featureStoreStandardAverageRecordSizeUnit', occurrence: 0 },
    { kind: 'input', label: 'Number of writes Value', key: 'featureStoreStandardWriteRequests', occurrence: 0 },
    { kind: 'select', label: 'million per month', key: 'featureStoreStandardWriteRequestsUnit', occurrence: 0 },
    { kind: 'input', label: 'Number of reads Value', key: 'featureStoreStandardReadRequests', occurrence: 0 },
    { kind: 'select', label: 'million per month', key: 'featureStoreStandardReadRequestsUnit', occurrence: 1 },
    { kind: 'input', label: 'Write rate Value', key: 'featureStoreStandardWriteRate', occurrence: 0 },
    { kind: 'select', label: 'per second', key: 'featureStoreStandardWriteRateUnit', occurrence: 0 },
    { kind: 'input', label: 'Read rate Value', key: 'featureStoreStandardReadRate', occurrence: 0 },
    { kind: 'select', label: 'per second', key: 'featureStoreStandardReadRateUnit', occurrence: 1 },
    { kind: 'input', label: 'Data storage size Value', key: 'featureStoreInMemoryDataStorageAmount', occurrence: 1 },
    { kind: 'select', label: 'GB', key: 'featureStoreInMemoryDataStorageUnit', occurrence: 1 },
    { kind: 'input', label: 'Average record size Value', key: 'featureStoreInMemoryAverageRecordSize', occurrence: 1 },
    { kind: 'select', label: 'KB', key: 'featureStoreInMemoryAverageRecordSizeUnit', occurrence: 1 },
    { kind: 'input', label: 'Number of writes Value', key: 'featureStoreInMemoryWriteRequests', occurrence: 1 },
    { kind: 'select', label: 'million per month', key: 'featureStoreInMemoryWriteRequestsUnit', occurrence: 2 },
    { kind: 'input', label: 'Number of reads Value', key: 'featureStoreInMemoryReadRequests', occurrence: 1 },
    { kind: 'select', label: 'million per month', key: 'featureStoreInMemoryReadRequestsUnit', occurrence: 3 },
    { kind: 'select', label: 'Data transfer from', key: 'featureStoreInboundDataTransferFrom', occurrence: 0 },
    { kind: 'input', label: 'Enter Amount Enter amount', key: 'featureStoreInboundDataTransferAmount', occurrence: 0 },
    { kind: 'select', label: 'TB per month', key: 'featureStoreInboundDataTransferUnit', occurrence: 0 },
    { kind: 'select', label: 'Data transfer to', key: 'featureStoreOutboundDataTransferTo', occurrence: 0 },
    { kind: 'input', label: 'Enter Amount Enter amount', key: 'featureStoreOutboundDataTransferAmount', occurrence: 1 },
    { kind: 'select', label: 'TB per month', key: 'featureStoreOutboundDataTransferUnit', occurrence: 1 }
  ]);

  await fillFeature('SageMaker Training', 'enableSageMakerTraining', [
    { kind: 'input', label: 'Number of training jobs per month Enter the number of training jobs per month', key: 'trainingJobsPerMonth' },
    { kind: 'input', label: 'Number of instances per job Enter the number of instances per job', key: 'trainingInstancesPerJob' },
    { kind: 'input', label: 'Hour(s) per instance per job Enter the number of hours per instance per job', key: 'trainingHoursPerInstancePerJob' },
    { kind: 'combobox', label: 'Select an instance', key: 'trainingInstanceType', occurrence: 0 },
    { kind: 'select', label: 'General Purpose SSD (gp2)', key: 'trainingStorageType', occurrence: 0 },
    { kind: 'input', label: 'Storage amount Value', key: 'trainingStorageAmount' },
    { kind: 'select', label: 'Unit', key: 'trainingStorageUnit', occurrence: 0 }
  ]);

  await fillFeature('SageMaker Real-Time Inference', 'enableSageMakerRealTimeInference', [
    { kind: 'input', label: 'Number of models deployed Enter the number of models deployed', key: 'realTimeModelsDeployed' },
    { kind: 'input', label: 'Number of models per endpoint Enter the number of models per endpoint', key: 'realTimeModelsPerEndpoint' },
    { kind: 'input', label: 'Number of instances per endpoint Enter the number of instances per endpoint', key: 'realTimeInstancesPerEndpoint' },
    { kind: 'input', label: 'Endpoint hour(s) per day Enter the number of hours endpoint is active per day', key: 'realTimeHoursPerDay' },
    { kind: 'input', label: 'Endpoint day(s) per month Enter the number of days endpoint is active per month', key: 'realTimeDaysPerMonth' },
    { kind: 'combobox', label: 'Select an instance', key: 'realTimeInstanceType', occurrence: 0 },
    { kind: 'booleanSelect', label: 'Add Elastic Inference Accelerator instances', key: 'enableElasticInferenceAcceleratorInstances', occurrence: 0 },
    { kind: 'select', label: 'Elastic Inference Instance', key: 'elasticInferenceInstance', occurrence: 0 },
    { kind: 'input', label: 'Number of Model Monitor jobs per month Enter the number of Model Monitor jobs per month', key: 'realTimeModelMonitorJobsPerMonth' },
    { kind: 'input', label: 'Number of Model Monitor instances per job Enter the number of Model Monitor instances per job', key: 'realTimeModelMonitorInstancesPerJob' },
    { kind: 'input', label: 'Hour(s) per Model Monitor instance per job Enter the number of hours per Model Monitor instance per job', key: 'realTimeModelMonitorHoursPerJob' },
    { kind: 'combobox', label: 'Select an instance', key: 'realTimeModelMonitorInstanceType', occurrence: 1 },
    { kind: 'select', label: 'General Purpose SSD (gp2)', key: 'realTimeStorageType', occurrence: 0 },
    { kind: 'input', label: 'Storage amount Value', key: 'realTimeStorageAmount' },
    { kind: 'select', label: 'Unit', key: 'realTimeStorageUnit', occurrence: 0 },
    { kind: 'input', label: 'Data Processed IN Value', key: 'realTimeDataProcessedInAmount' },
    { kind: 'select', label: 'GB', key: 'realTimeDataProcessedInUnit', occurrence: 0 },
    { kind: 'input', label: 'Data Processed OUT Value', key: 'realTimeDataProcessedOutAmount' },
    { kind: 'select', label: 'GB', key: 'realTimeDataProcessedOutUnit', occurrence: 1 }
  ]);

  await fillFeature('SageMaker Asynchronous Inference', 'enableSageMakerAsynchronousInference', [
    { kind: 'input', label: 'Number of models deployed Enter the number of models deployed', key: 'asyncModelsDeployed' },
    { kind: 'input', label: 'Number of models per endpoint Enter the number of models per endpoint', key: 'asyncModelsPerEndpoint' },
    { kind: 'input', label: 'Number of instances per endpoint Enter the number of instances per endpoint', key: 'asyncInstancesPerEndpoint' },
    { kind: 'input', label: 'Endpoint hour(s) per day Enter the number of hours endpoint is active per day including cool down periods for autoscaling', key: 'asyncHoursPerDay' },
    { kind: 'input', label: 'Endpoint day(s) per month Enter the number of days endpoint is active per month', key: 'asyncDaysPerMonth' },
    { kind: 'combobox', label: 'Select an instance', key: 'asyncInstanceType', occurrence: 0 },
    { kind: 'select', label: 'General Purpose SSD (gp2)', key: 'asyncStorageType', occurrence: 0 },
    { kind: 'input', label: 'Storage amount Value', key: 'asyncStorageAmount' },
    { kind: 'select', label: 'Unit', key: 'asyncStorageUnit', occurrence: 0 },
    { kind: 'input', label: 'Data Processed IN Value', key: 'asyncDataProcessedInAmount' },
    { kind: 'select', label: 'GB', key: 'asyncDataProcessedInUnit', occurrence: 0 },
    { kind: 'input', label: 'Data Processed OUT Value', key: 'asyncDataProcessedOutAmount' },
    { kind: 'select', label: 'GB', key: 'asyncDataProcessedOutUnit', occurrence: 1 }
  ]);

  await fillFeature('SageMaker Batch Transform', 'enableSageMakerBatchTransform', [
    { kind: 'input', label: 'Number of Batch Transform jobs per month Enter the number of Batch Transform jobs per month', key: 'batchTransformJobsPerMonth' },
    { kind: 'input', label: 'Number of instances per job Enter the number of instances per job', key: 'batchTransformInstancesPerJob' },
    { kind: 'input', label: 'Hour(s) per instance per job Enter the number of hours per instance per job', key: 'batchTransformHoursPerInstancePerJob' },
    { kind: 'combobox', label: 'Select an instance', key: 'batchTransformInstanceType', occurrence: 0 }
  ]);

  await fillFeature('SageMaker Edge Manager', 'enableSageMakerEdgeManager', [
    { kind: 'input', label: 'Number of registered devices Enter number of registered devices', key: 'edgeManagerRegisteredDevices' },
    { kind: 'input', label: 'Number of managed models Enter number of managed models per month', key: 'edgeManagerManagedModels' }
  ]);

  await fillFeature('SageMaker Serverless Inference', 'enableSageMakerServerlessInference', [
    { kind: 'select', label: 'millions', key: 'serverlessRequestsUnit', occurrence: 0 },
    { kind: 'input', label: 'Number of request per month Enter number of requests in units selected', key: 'serverlessRequestsPerMonth' },
    { kind: 'input', label: 'Duration of each request (ms) Enter the duration of each request (ms)', key: 'serverlessRequestDurationMs' },
    { kind: 'select', label: '1024', key: 'serverlessMemoryMb', occurrence: 0 },
    { kind: 'input', label: 'Provisioned Concurrency value Enter number of requests in units selected', key: 'serverlessProvisionedConcurrencyRequests' },
    { kind: 'input', label: 'Time for which Provisioned Concurrency is enabled Value', key: 'serverlessProvisionedConcurrencyHours' },
    { kind: 'select', label: 'hours', key: 'serverlessProvisionedConcurrencyHoursUnit', occurrence: 0 },
    { kind: 'input', label: 'Number of requests for Provisioned Concurrency per month Enter number of requests in units selected', key: 'serverlessProvisionedRequestsPerMonth' },
    { kind: 'input', label: 'Duration of each request (ms) Enter the duration of each request (ms)', key: 'serverlessProvisionedRequestDurationMs', occurrence: 1 },
    { kind: 'select', label: '1024', key: 'serverlessProvisionedMemoryMb', occurrence: 1 },
    { kind: 'input', label: 'Data Processed IN Value', key: 'serverlessDataProcessedInAmount' },
    { kind: 'select', label: 'GB', key: 'serverlessDataProcessedInUnit', occurrence: 0 },
    { kind: 'input', label: 'Data Processed OUT Value', key: 'serverlessDataProcessedOutAmount' },
    { kind: 'select', label: 'GB', key: 'serverlessDataProcessedOutUnit', occurrence: 1 }
  ]);

  await fillFeature('SageMaker Autopilot', 'enableSageMakerAutopilot', [
    { kind: 'input', label: 'Number of Autopilot Jobs per month Enter Number of Autopilot Jobs per month', key: 'autopilotJobsPerMonth' },
    { kind: 'input', label: 'Number of training hours per Autopilot job Enter Number of training hours per autopilot job', key: 'autopilotTrainingHoursPerJob' }
  ]);

  await setToggle('SageMaker MLflow', !!config.enableSageMakerMLflow);

  await jitter(400, 800);
  const saveButton = [...document.querySelectorAll('button')]
    .find(button => normalizeText(button.textContent) === 'Save and add service');
  if (saveButton) {
    scrollTo(saveButton);
    await jitter(300, 600);
    saveButton.click();
    console.log('[Amazon SageMaker] Saved successfully!');
  } else {
    console.warn('[Amazon SageMaker] Save and add service button not found');
  }

})({
  // Override defaults here. All keys are optional — omit to keep script default.
  // region: 'US East (N. Virginia)',
  // enableSageMakerStudioNotebooks: false,
  // enableSageMakerOnDemandNotebookInstances: false,
  // enableSageMakerTraining: true,
  // trainingInstanceType: 'ml.m5.xlarge',
  // trainingJobsPerMonth: 10,
  // trainingHoursPerInstancePerJob: 2,
  // enableSageMakerRealTimeInference: true,
  // realTimeInstanceType: 'ml.m5.large',
  // realTimeHoursPerDay: 24,
  // realTimeDaysPerMonth: 30,
});
