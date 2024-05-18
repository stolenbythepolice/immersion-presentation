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

## License

MIT © [gillescastel](https://github.com/gillescastel)

## Afterword

This project has been recovered/inferred from the sourcemaps of the npm package [immersion-presentation](https://www.npmjs.com/package/immersion-presentation/) by [gillescastel](https://github.com/gillescastel).

## Missing Code

There is clear indication of the following code being now lost:
 - `examples/` folder
 - `make-pdf/` folder
 - tests (since the project has been active for a while it is safe to assume that tests existed)

