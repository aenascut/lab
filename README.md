### Installation

Run `npm install` at the root of the project to install all the dependencies.

### Pre-requisites

1) Akamai's authentication credentials should be present in the `.edgerc` file.

2) The Akamai CLI should be installed and configured. 

3) Update the `.env` file with the correct `EDGEWORKER_ID`


### Usage

- `npm run format` - Runs the linter on the project.
- `npm run lint` - Runs the linter on the project.
- `npm run build` - Builds in `/dist/` the Akamai project; It will automatically increment the `bundle.json` version and update `EDGEWORKER_VERSION` in the `.env` file
- `npm run edgeworker:auth` - Generates token for the debug headers required to see the Akamai logs
- `npm run edgeworker:deploy` - Deploys the Akamai build to the Akamai network
- `npm run edgeworker:activate` - Activates the build on the Akamai staging network
- `npm run edgeworker:status` - Retrieves the activations status of the build on the Akamai edge worker

#### Workflow

1) Run `npm run build` to build the project
2) Run `npm run edgeworker:deploy` to deploy the build to the Akamai network
3) Run `npm run edgeworker:activate` to activate the build on the Akamai staging network
4) Run `npm run edgeworker:status` to check the activation status; when is `COMPLETE` the activation is done

5) With changes
