const CONFIG = {
  APPS_SCRIPT_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"
};

const form = document.querySelector("#applicationForm");
const steps = [...document.querySelectorAll(".form-step")];
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const submitBtn = document.querySelector("#submitBtn");
const progressFill = document.querySelector("#progressFill");
const progressText = document.querySelector("#progressText");
const successCard = document.querySelector("#successCard");
const newApplicationBtn = document.querySelector("#newApplicationBtn");

let currentStep = 0;

function updateStepUI() {
  steps.forEach((step, index) => {
    step.classList.toggle("active", index === currentStep);
  });

  const progressPercent = ((currentStep + 1) / steps.length) * 100;
  progressFill.style.width = `${progressPercent}%`;
  progressText.textContent = `Step ${currentStep + 1} of ${steps.length}`;

  prevBtn.classList.toggle("hidden", currentStep === 0);
  nextBtn.classList.toggle("hidden", currentStep === steps.length - 1);
  submitBtn.classList.toggle("hidden", currentStep !== steps.length - 1);
}

function setFieldError(field, message) {
  const wrapper = field.closest(".field");
  if (!wrapper) return;

  wrapper.classList.toggle("invalid", Boolean(message));

  const error = wrapper.querySelector(".error");
  if (error) {
    error.textContent = message || "";
  }
}

function isValidUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateStep(index) {
  let valid = true;
  const step = steps[index];
  const fields = [...step.querySelectorAll("input, textarea, select")];

  fields.forEach((field) => {
    if (field.type === "checkbox") return;

    const value = field.value.trim();
    let message = "";

    if (field.required && !value) {
      message = "This field is required.";
    } else if (field.type === "email" && value && !field.checkValidity()) {
      message = "Enter a valid email address.";
    } else if (field.type === "url" && !isValidUrl(value)) {
      message = "Enter a valid URL starting with http:// or https://.";
    }

    setFieldError(field, message);

    if (message) {
      valid = false;
    }
  });

  const consent = step.querySelector('input[name="consent"]');
  const consentError = document.querySelector("#consentError");

  if (consent && !consent.checked) {
    consentError.textContent = "Please confirm your consent before submitting.";
    valid = false;
  } else if (consentError) {
    consentError.textContent = "";
  }

  return valid;
}

function collectFormData() {
  const formData = new FormData(form);
  const payload = {};

  for (const [key, value] of formData.entries()) {
    payload[key] = typeof value === "string" ? value.trim() : value;
  }

  payload.consent = formData.get("consent") === "on";
  payload.submittedAt = new Date().toISOString();
  payload.sourcePage = window.location.href;

  return payload;
}

async function submitApplication(payload) {
  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes("PASTE_YOUR")) {
    throw new Error("Missing Apps Script URL. Add your deployed Web App URL in script.js.");
  }

  await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });
}

nextBtn.addEventListener("click", () => {
  if (!validateStep(currentStep)) return;

  currentStep += 1;
  updateStepUI();
});

prevBtn.addEventListener("click", () => {
  currentStep -= 1;
  updateStepUI();
});

form.addEventListener("input", (event) => {
  const field = event.target;

  if (field.matches("input, textarea, select")) {
    setFieldError(field, "");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateStep(currentStep)) return;

  const payload = collectFormData();

  submitBtn.disabled = true;
  submitBtn.classList.add("loading");

  try {
    await submitApplication(payload);
    form.classList.add("hidden");
    successCard.classList.remove("hidden");
  } catch (error) {
    alert(error.message || "Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
  }
});

newApplicationBtn.addEventListener("click", () => {
  form.reset();
  currentStep = 0;
  updateStepUI();
  successCard.classList.add("hidden");
  form.classList.remove("hidden");
});

updateStepUI();
