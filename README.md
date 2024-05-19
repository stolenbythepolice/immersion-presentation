<p align="center">
  <img src="./assets/logo/logo.png" alt="Immersion" width="400">
  <br/>
</p>

Immersion is an open source presentation framework based on React.

Focussing on mathematical presentations, it features the following:

* Full LaTeX formula support with custom preamble
* A visual editor for animating LaTeX formulae
* Animate figures with LaTeX labels
* Use an existing BibTeX bibliography file for references
* Option to use a Prezi-style non-linear (useful for presenting proofs consisting of multiple Lemmas)
* Export as a pdf
* Presenter notes

## Getting started

To get started, install the latest version of [Node](https://nodejs.org/en/) and [Yarn](https://classic.yarnpkg.com/en/docs/install/). Then to initialize a presentation, run the following in your terminal:

```bash
npx create-react-app title-of-your-presentation --template immersion
```

This will create a directory named `title-of-your-presentation`.
Once in the directory execute `yarn start` and the presentation will open up in a browser window. Upon changing the contents, the browser will automatically reload.

### Notes from the future

This repository makes use of the now-obsolete React v16. Due to the React team being bitchy about it and not allowing the automated use of the older tools, you will have to manually adjust a few things:

In the root of your presentation, open the `package.json` file and replace the "dependencies" section with the following:
```json
  "dependencies": {
    "cra-template-immersion": "1.0.3",
    "immersion-presentation": "1.1.5",
    "react": "^16.0.0",
    "react-dom": "^16.0.0",
    "react-scripts": "^4.0.3"
  },
```

Then launch
```bash
npm i
```

If you are using NodeJs version 17 or above, make sure to set the environment variable `NODE_OPTIONS` to `--openssl-legacy-provider`

On Unix-like (Linux, macOS, Git bash, etc.):
```bash
export NODE_OPTIONS=--openssl-legacy-provider
```

On Windows command prompt:
```cmd
set NODE_OPTIONS=--openssl-legacy-provider
```

On PowerShell:
```poweshell
$env:NODE_OPTIONS = "--openssl-legacy-provider"
```

Source: (Stackoverflow)[https://stackoverflow.com/questions/69692842/error-message-error0308010cdigital-envelope-routinesunsupported]

When you are done, just run `yarn start`

## License

MIT © [gillescastel](https://github.com/gillescastel)

## Afterword

This project has been recovered/inferred from the sourcemaps of the npm package [immersion-presentation](https://www.npmjs.com/package/immersion-presentation/) by [gillescastel](https://github.com/gillescastel).

## Missing Code

There is clear indication of the following code being now lost:
 - `examples/` folder
 - `make-pdf/` folder
 - tests (since the project has been active for a while it is safe to assume that tests existed)

