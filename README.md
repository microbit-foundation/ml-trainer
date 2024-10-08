# ml-trainer

Train a machine learning model on movement data from the micro:bit's
accelerometer. Run it on your BBC micro:bit, building your own progam that uses
the machine learning model in Microsoft MakeCode.

Try it at https://createai.microbit.org

## History

This repository is derived from [ML-Machine](https://ml-machine.org)
([GitHub](https://github.com/microbit-foundation/cctd-ml-machine.)), a free and
open-source interactive machine-learning platform from the [Center for
Computational Thinking and Design at Aarhus University](https://cctd.au.dk/).

Significant changes have been made to align with the tech stack of other
Micro:bit Educational Foundation applications, add and remove features, and
revise the user experience for some features also in ML-Machine. We encourage
you to review both projects and see which best fits your needs.

## Building and running the app

Getting up and running:

1. Ensure you have a working [Node.js environment](https://nodejs.org/en/download/). We recommend using the LTS version of Node.
2. Checkout this repository with Git. GitHub have some [learning resources for Git](https://docs.github.com/en/get-started/quickstart/git-and-github-learning-resources) that you may find useful.
3. Install the dependencies by running `npm install` on the command line in the checkout folder.
4. Choose from the NPM scripts documented below. Try `npm start` if you're not sure.

### `npm run dev`

Runs the app in the development mode.

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

This does not show TypeScript or lint errors.
Use the eslint plugin for your editor and consider also running `npm run typecheck:watch` to see full type checking errors.

### `npm test`

Launches the [test runner](https://vitest.dev/) in interactive mode (unless the `CI` environment variable is defined).
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `dist` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Deployments

Most users should use the supported Foundation deployment at https://createai.microbit.org/

The editor is deployed by [GitHub actions](https://github.com/microbit-foundation/ml-trainer/actions).

## License

This software is under the MIT open source license.

[SPDX-License-Identifier: MIT](LICENSE)

Significant code is derived from ML-Machine (also MIT licensed) and is (c)
Center for Computational Thinking and Design at Aarhus University and
contributors. See individual file copyright notices for more details.

We use dependencies via the NPM registry as specified by the package.json file
under common Open Source licenses.

Full details of each package can be found by running `license-checker`:

```bash
$ npx license-checker --direct --summary --production
```

Omit the flags as desired to obtain more detail.

The repository includes forks of Lancaster's micro:bit-samples repositories for
micro:bit [V1](https://github.com/lancaster-university/microbit-samples) and
[V2](https://github.com/lancaster-university/microbit-v2-samples). They are MIT
licensed.

## Code of Conduct

Trust, partnership, simplicity and passion are our core values we live and
breathe in our daily work life and within our projects. Our open-source
projects are no exception. We have an active community which spans the globe
and we welcome and encourage participation and contributions to our projects
by everyone. We work to foster a positive, open, inclusive and supportive
environment and trust that our community respects the micro:bit code of
conduct. Please see our [code of conduct](https://microbit.org/safeguarding/)
which outlines our expectations for all those that participate in our
community and details on how to report any concerns and what would happen
should breaches occur.
