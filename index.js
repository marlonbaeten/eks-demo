// see https://github.com/Myriad-Dreamin/typst.ts/blob/main/github-pages/preview.html

const contentDiv = document.getElementById('content');

const previewSvg = (mainContent, inputs) => {
  $typst
    .svg({ mainContent, inputs })
    .then(svg => {
      contentDiv.innerHTML = svg;
    })
    .catch(error => {
      console.error('Unable to render Typst preview', error);
    });
};

const exportPdf = (mainContent, inputs) =>
  $typst
    .pdf({ mainContent, inputs })
    .then(pdfData => {
      const pdfFile = new Blob([pdfData], { type: 'application/pdf' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfFile);
      link.target = '_blank';
      link.download = 'h1.pdf';
      link.click();
      URL.revokeObjectURL(link.href);
    })
    .catch(error => {
      console.error('Unable to export Typst PDF', error);
    });

document.getElementById('typst').addEventListener('load', async function () {
  $typst.setCompilerInitOptions({
    getModule: () => '/lib/typst_ts_web_compiler_bg.wasm',
  });

  $typst.setRendererInitOptions({
    getModule: () => '/lib/typst_ts_renderer_bg.wasm',
  });

  const response = await fetch('./h1.typst');
  const template = await response.text();

  const form = document.querySelector('form');
  const downloadButton = document.getElementById('download');
  const candidatesContainer = document.getElementById('candidates');
  const addCandidateButton = document.getElementById('add-candidate');
  const candidateTemplate = document.getElementById('candidate-template');

  if (!form || !candidatesContainer || !addCandidateButton) {
    return;
  }

  const updateCandidateNumbers = () => {
    const candidateForms = candidatesContainer.querySelectorAll('.candidate');
    candidateForms.forEach((formElement, index) => {
      const numberBadge = formElement.querySelector('.candidate-number h4');
      if (numberBadge) {
        numberBadge.textContent = `${index + 1}`;
      }
    });
  };

  const clearCandidateInputs = candidateElement => {
    if (!candidateElement) {
      return;
    }

    const inputs = candidateElement.querySelectorAll('input');
    inputs.forEach(input => {
      input.value = '';
    });
  };

  const createCandidateElement = () => {
    if (candidateTemplate && candidateTemplate.content.firstElementChild) {
      return candidateTemplate.content.firstElementChild.cloneNode(true);
    }

    const fallback = candidatesContainer.querySelector('.candidate');
    return fallback ? fallback.cloneNode(true) : null;
  };

  const ensureCandidatePresent = () => {
    if (candidatesContainer.querySelector('.candidate')) {
      return;
    }

    const newCandidate = createCandidateElement();
    if (!newCandidate) {
      return;
    }

    clearCandidateInputs(newCandidate);

    if (candidateTemplate) {
      candidatesContainer.insertBefore(newCandidate, candidateTemplate);
    } else {
      candidatesContainer.appendChild(newCandidate);
    }
  };

  const collectFormData = () => {
    const partyName = form.querySelector('#input')?.value?.trim() ?? '';
    const candidateElements = candidatesContainer.querySelectorAll('.candidate');

    const candidates = Array.from(candidateElements).map((candidate, index) => {
      const getFieldValue = field =>
        candidate.querySelector(`[data-field="${field}"]`)?.value?.trim() ?? '';

      return {
        number: index + 1,
        name: getFieldValue('name'),
        initials: getFieldValue('initials'),
        birthdate: getFieldValue('birthdate'),
        locality: getFieldValue('locality'),
      };
    });

    return {
      party: partyName,
      candidates,
    };
  };

  const buildInputs = () => ({
    'form-data': JSON.stringify(collectFormData()),
  });

  const refreshPreview = () => {
    previewSvg(template, buildInputs());
  };

  ensureCandidatePresent();
  updateCandidateNumbers();
  refreshPreview();

  addCandidateButton.addEventListener('click', () => {
    const newCandidate = createCandidateElement();
    if (!newCandidate) {
      return;
    }

    clearCandidateInputs(newCandidate);

    if (candidateTemplate) {
      candidatesContainer.insertBefore(newCandidate, candidateTemplate);
    } else {
      candidatesContainer.appendChild(newCandidate);
    }

    updateCandidateNumbers();
    refreshPreview();
  });

  candidatesContainer.addEventListener('click', event => {
    const removeButton = event.target.closest('.remove-candidate');
    if (!removeButton) {
      return;
    }

    const candidate = removeButton.closest('.candidate');
    if (!candidate) {
      return;
    }

    candidate.remove();
    ensureCandidatePresent();
    updateCandidateNumbers();
    refreshPreview();
  });

  form.addEventListener('input', refreshPreview);
  form.addEventListener('change', refreshPreview);

  downloadButton?.addEventListener('click', () => {
    exportPdf(template, buildInputs());
  });
});
