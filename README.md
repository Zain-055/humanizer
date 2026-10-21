# Humanlify

A browser-based text analysis and rewriting demo. It includes a heuristic text-pattern analyzer and client-side rewriting controls for casual, professional, and academic tones.

## Features

- Analyze pasted text and show pattern-based indicators and an estimated score.
- Rewrite text with selectable tone and intensity settings.
- Copy, clear, and edit the input and output in the browser.
- Save app preferences locally in browser storage.

## Run locally

Open `index.html` in a modern browser. The project is a static web app and does not require a build step or backend server.

## Important limitations

The analyzer uses hand-written text patterns; it is not a trained AI model and cannot reliably determine who wrote a piece of text. Its scores are not evidence of AI authorship and should not be used for academic, employment, or other consequential decisions. The rewriting feature applies client-side text transformations and does not call a generative AI service.
