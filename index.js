// see https://github.com/Myriad-Dreamin/typst.ts/blob/main/github-pages/preview.html

const mockName = 'Partij voor Vooruitgang en Solidariteit';

const mock = [
  {
    "name": "Dekker",
    "initials": "J.",
    "birthdate": "21-08-1986",
    "locality": "Amsterdam"
  },
  {
    "name": "Chan",
    "initials": "W. G.",
    "birthdate": "20-01-1987",
    "locality": "Eindhoven"
  },
  {
    "name": "Kok",
    "initials": "J. P.",
    "birthdate": "02-10-1950",
    "locality": "Eindhoven"
  },
  {
    "name": "De Vries",
    "initials": "E. J.",
    "birthdate": "23-08-1953",
    "locality": "Amsterdam"
  },
  {
    "name": "El Amrani",
    "initials": "V. U.",
    "birthdate": "31-10-1994",
    "locality": "Almere"
  },
  {
    "name": "De Boer",
    "initials": "F. M",
    "birthdate": "04-11-2000",
    "locality": "Eindhoven"
  },
  {
    "name": "Brouwer",
    "initials": "H.",
    "birthdate": "30-08-1999",
    "locality": "Almere"
  },
  {
    "name": "Hendriks",
    "initials": "V. T.",
    "birthdate": "24-03-1992",
    "locality": "Tilburg"
  },
  {
    "name": "Khan",
    "initials": "W. G",
    "birthdate": "16-10-1990",
    "locality": "Almere"
  },
  {
    "name": "Bos",
    "initials": "C. C.",
    "birthdate": "30-11-1996",
    "locality": "Enschede"
  }
];

document.getElementById('typst').addEventListener('load', async function () {
  $typst.setCompilerInitOptions({
    getModule: () => '/lib/typst_ts_web_compiler_bg.wasm',
  });

  $typst.setRendererInitOptions({
    getModule: () => '/lib/typst_ts_renderer_bg.wasm',
  });

  const templateResponse = await fetch('./h1.typ');
  const template = await templateResponse.text();

  const memoryAccessModel = new TypstCompileModule.MemoryAccessModel();
  $typst.use(TypstSnippet.withAccessModel(memoryAccessModel),);
  $typst.use(TypstSnippet.preloadFontFromUrl('/fonts/DMSans-Regular.ttf'));
  $typst.use(TypstSnippet.preloadFontFromUrl('/fonts/DMSans-Italic.ttf'));
  $typst.use(TypstSnippet.preloadFontFromUrl('/fonts/DMSans-Bold.ttf'));
  $typst.use(TypstSnippet.disableDefaultFontAssets);

  const form = document.querySelector('form');
  const contentDiv = document.getElementById('content');
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
      formElement.querySelector('.candidate-number h4').textContent = `${index + 1}`;
      formElement.querySelector('input[name^="candidate"][name$="[name]"]').name = `candidate[${index}][name]`;
      formElement.querySelector('input[name^="candidate"][name$="[initials]"]').name = `candidate[${index}][initials]`;
      formElement.querySelector('input[name^="candidate"][name$="[birthdate]"]').name = `candidate[${index}][birthdate]`;
      formElement.querySelector('input[name^="candidate"][name$="[locality]"]').name = `candidate[${index}][locality]`;
    });

    previewSvg();
  };

  const createCandidateElement = () => {
    const element = candidateTemplate.content.firstElementChild.cloneNode(true);

    /// fill this form with random data
    const candidateCount = candidatesContainer.querySelectorAll('.candidate').length;
    element.querySelector('input[name="candidate[][name]"]').value = mock[candidateCount % mock.length].name;
    element.querySelector('input[name="candidate[][initials]"]').value = mock[candidateCount % mock.length].initials;
    element.querySelector('input[name="candidate[][birthdate]"]').value = mock[candidateCount % mock.length].birthdate;
    element.querySelector('input[name="candidate[][locality]"]').value = mock[candidateCount % mock.length].locality;

    return element;
  };

  const collectFormData = () => {
    const data = new FormData(form);

    const result = { name: data.get('name'), candidate: [] };

    for (const [key, value] of data.entries()) {
      const match = key.match(/^candidate\[(\d+)\]\[(\w+)\]$/);
      if (match) {
        const [, index, prop] = match;
        if (!result.candidate[index]) {
          result.candidate[index] = {
            number: parseInt(index, 10) + 1,
          };
        }
        result.candidate[index][prop] = value;
      }
    }

    return result;
  };

  const previewSvg = async () => {
    $typst.addSource('/inputs/h1.json', JSON.stringify(collectFormData()));

    try {
      const svg = await $typst.svg({ mainContent: template });
      contentDiv.innerHTML = svg;
    } catch (error) {
      console.error('Unable to render Typst preview', error);
    }
  };

  const exportPdf = async () => {
    $typst.addSource('/inputs/h1.json', JSON.stringify(collectFormData()));

    try {
      const pdfData = await $typst.pdf({ mainContent: template });
      const pdfFile = new Blob([pdfData], { type: 'application/pdf' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfFile);
      link.target = '_blank';
      link.download = 'h1.pdf';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Unable to export Typst PDF', error);
    }
  };

  // mock data
  form.name.value = mockName;

  for (let i = 0; i < 5; i++) {
    const candidateElement = createCandidateElement();
    candidatesContainer.appendChild(candidateElement);
  }

  updateCandidateNumbers();

  addCandidateButton.addEventListener('click', () => {
    const newCandidate = createCandidateElement();
    candidatesContainer.appendChild(newCandidate);

    updateCandidateNumbers();
  });

  candidatesContainer.addEventListener('click', event => {
    const removeButton = event.target.closest('.remove-candidate');

    if (!removeButton) {
      return;
    }

    const candidate = removeButton.closest('.candidate');

    candidate.remove();
    updateCandidateNumbers();
  });

  form.addEventListener('input', previewSvg);
  form.addEventListener('change', previewSvg);

  downloadButton?.addEventListener('click', () => {
    exportPdf(template);
  });
});
