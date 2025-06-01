# Deployment Guide

This doc covers different deployment and configuration scenarios. Note that you always have the option of just using the official Hone app at https://decentapps.net/hone/ without worrying about deploying.

The top-level sections are:

* Local Development - building from source, running a dev server, and other development-related topics.
* Static Content Deployment - production deployments based on copying static content files.
* Docker Deployment - production deployments based on the "Hone Server" Docker image.
* Custom LLM Configuration Reference - details about configuring Hone to use an LLM besides the default local LLM.

## Security Considerations for Production Hosting

The `Dockerfile` is my best attempt at specifying a secure web host with minimal permissions and attack surfaces. Even if you don't want to deploy a Docker container, you might benefit from reading through `Dockerfile` and `entrypoint.sh`. I've made many comments there. Consider using CSP headers to defend against potential supply chain attacks designed to exfiltrate data.

If you use custom LLMs, some of the blanket assurances I make with Hone no longer apply. Unlike with the local LLM default option, the user's data might be sent to a server where it could be cached, stored, sent to third parties, or breached. It is up to you to provide the appropriate protections and set expectations with your users on data privacy. Hone is designed to clearly represent to the user when a custom LLM is in use and allow them to choose the local LLM option if they prefer.

For custom LLMs, there are additional security best practices described in the "Custom LLM Configuration Reference".

# Local Development

Maybe you'd like to build Hone from source, and make some changes to it. Awesome! Keep reading.

## Running a Local Server

The following steps show how to run Hone as a web server on your local device for development or other non-production purposes:

1. `git clone https://github.com/erikh2000/hone.git` (clone the repo)
2. `cd hone` (change your working directory to the hone project directory)
3. `npm install` (installs dependencies needed to build the app)
4. `npm run fonts` (downloads a few fonts used by Hone so they can be served locally.)
5. `npm run dev` (launches the Vite web server, typically on port 3000. If 3000 is in use, Vite will pick another port—check the console output for the actual port.)
6. Browse to "http://localhost:3000" with your browser.

After the initial setup, just steps 5 and 6 are needed.

## Custom LLM Configuration

Hone, by default, uses an LLM loaded into the web browser via WebLLM. You can optionally configure a "custom LLM" for Hone (a separately-hosted LLM server exposing an inference endpoint). Steps to achieve this are shown below.

Pre-req: You already followed previous steps for "Running a Local Server".

1. If the Vite web server is running, stop it by pressing ctrl-C in the terminal window where it was launched.
2. Create a `llmConfig.json` file in the `public/custom` directory. See the separate "Custom LLM Configuration Reference" section to understand what goes in this file.
3. `npm run dev` (launches the Vite web server.)
4. Browse to "http://localhost:3000" with your browser.
5. Choose "Load LLM" button on the "Local Development" dialog.
6. A "Configure Custom LLM Settings" dialog will now appear. This is caused by the `llmConfig.json` file being present. Configure options as you want, and choose "Use Custom LLM" button.

If the settings in `llmConfig.json` are correct for your LLM host, Hone should now connect to the custom LLM and use it for prompts.

# Static Content Deployment

Hone is a purely static-content web app. There are no services for it to call, unless you use a custom LLM. You can follow the steps below to build and deploy it to your web server.

## Deploying to a Production Server

The following steps show how to deploy the Hone files to a production web server.

1. `git clone https://github.com/erikh2000/hone.git` (clone the repo)
2. `cd hone` (change your working directory to the hone project directory)
3. `npm install` (installs dependencies needed to build the app)
4. `npm run fonts` (downloads a few fonts used by Hone)
5. `npm run build` (creates all static content needed to serve Hone in the ./dist directory.)
6. Upload the contents of the `./dist` directory to the appropriate web directory on your production server.

The last step above really should be as simple as using `ftp`, `rsync`, `aws s3 cp`, or similar tool to copy the files to the right place.

All paths are relative, so deploying to paths served with non-root URLs should work fine.

## Custom LLM Configuration

Hone, by default, uses an LLM loaded into the web browser via WebLLM. You can optionally configure a "custom LLM" for Hone (a separately-hosted LLM server exposing an inference endpoint). 

If your custom LLM API doesn't have CORS allowances for cross-domain calls, you will need to create a proxy on the same web host that is serving Hone. This will be too specific to your hosting configuration for me to provide detailed steps below. Alternatively, you could deploy with the Hone server Docker container. (It includes a configurable proxy.) You can also use `Dockerfile` and `entrypoint.sh` as a reference for your own configuration.

Pre-req: You already followed previous steps for "Deploying to a Production Server".

1. Create a `llmConfig.json` file in the `/custom` directory relative to the web-served root. See the separate "Custom LLM Configuration Reference" section to understand what goes in this file.
2. Browse to the URL from which your web host serves Hone or reload the page.
3. A "Configure Custom LLM Settings" dialog will now appear. This is caused by the `llmConfig.json` file being present. Configure options as you want, and choose "Use Custom LLM" button. (This last step is performed by all users each time they navigate to Hone.)

If the settings in `llmConfig.json` are correct for your LLM host, Hone should now connect to the custom LLM and use it for prompts.

# Docker Deployment

## Pulling and Running a Docker Image from GHCR

While you don't need a Docker image to build or run Hone, containerization can simplify deployments in many environments. The following steps show how to pull and run the latest Docker image of Hone using GitHub Container Registry.

1. `docker pull ghcr.io/erikh2000/hone-server:latest` (pull the latest image)
2. `docker run -d --name hone-server -p 8080:8080 ghcr.io/erikh2000/hone-server:latest` (start container from image)
3. Browse to "http://localhost:8080" with your browser.

## Updating a Running Docker Container from GHCR

If you are running Hone using Docker and want to update to the latest version:

1. `docker stop hone-server` (stop the container)
2. `docker rm hone-server` (remove the old container, which does not store any persistent data)
3. `docker pull ghcr.io/erikh2000/hone-server:latest` (pull the latest image)
4. `docker run -d --name hone-server -p 8080:8080 ghcr.io/erikh2000/hone-server:latest` (start new container from updated image)

There is no data to preserve from the old container because Hone does not store any server-side state. Any user data remains in the web browser's persistent storage.

## Checking Logs for Debugging

No Hone code runs on the server, other than `entrypoint.sh` when the container starts. The main Docker log will show you the Nginx log, which might be useful for troubleshooting issues around proxy connectivity. To access that:

`docker logs hone-server`

Since Hone code runs on the client (web browser), you may find it more helpful to use the browser's debugging tools to view console logging. 

* Chrome: Right-click the page → Inspect → Console tab
* Firefox: Right-click the page → Inspect → Console tab

When an error message is shown to the user, a more detailed version of the error is often available in the browser console.

## Creating a Docker Image

If you'd like to modify the Hone server Docker image for your own purposes, such as changing web server configuration or deploying modified Hone source, the following steps show how to build and run a Docker image for Hone:

1. `git clone https://github.com/erikh2000/hone.git` (clone the repo)
2. `cd hone` (change your working directory to the hone project directory)
3. `npm install` (installs dependencies needed to build the app)
4. `npm run docker` (creates a hone-server image that bundles a minimal, production-ready Nginx web server with Hone.)

If you want to try out the image, continue with:

5. `docker run -d -p 8080:8080 hone-server` (launches a container based on the hone-server image, serving on port 8080)
6. Browse to "http://localhost:8080" with your browser.

The Docker image has been built with the following best practices in mind:

* Minimal footprint: Only the necessary runtime components are included — build dependencies and extraneous software have been omitted.
* Unprivileged execution: Nginx runs under a non-root user for enhanced security.
* Hardened configuration: Strict Content Security Policy (CSP) headers and minimal Nginx settings reduce the risk of supply chain attacks.
* Transparent design: Detailed comments in the Dockerfile explain all key decisions.

For more details on security measures, see the `Dockerfile` and `entrypoint.sh`, where key decisions are explained.

I always welcome feedback. But on security, I double-welcome it! Please feel free to open an issue or contact me if you have any suggestions.

## Custom LLM Configuration

Hone, by default, uses an LLM loaded into the web browser via WebLLM. You can optionally configure a "custom LLM" for Hone (a separately-hosted LLM server exposing an inference endpoint). 

If your custom LLM API doesn't have CORS allowances for cross-domain calls, you will need to configure the container to provide a proxy with the `proxyUrl` setting. 

Pre-req: You already followed previous steps for "Creating a Docker Image".

1. Create a `llmConfig.json` file in a location accessible from where `docker` will be executed in the next step. See the separate "Custom LLM Configuration Reference" section to understand what goes in this file.
2. `docker run -d -v /path/to/llmConfig.json:/etc/hone/llmConfig.json:ro hone-server` (launches a container based on the hone-server image, serving on port 8080, with custom LLM configuration as specified in the mounted `llmConfig.json`.) 
3. Browse to the URL from which your web host serves Hone or reload the page.
4. A "Configure Custom LLM Settings" dialog will now appear. This is caused by the `llmConfig.json` file being present. Configure options as you want, and choose "Use Custom LLM" button. (This last step is performed by all users each time they navigate to Hone.)

If the settings in `llmConfig.json` are correct for your LLM host, Hone should now connect to the custom LLM and use it for prompts.

# Custom LLM Configuration Reference

The Custom LLM you use needs to serve an "OpenAI-like" completions API. Hone has been successfully tested with Ollama and OpenAI, and I'm sure many other integrations will work as well. It's a common practice in companies using cloud-hosted/on-prem LLMs to thinly wrap the LLM API with their own authentication scheme, and Hone is meant to support this.

The custom LLM configuration is specified in `llmConfig.json` served from the `/custom` folder of the web host, relative to the folder from which Hone serves. When a user navigates to Hone, the client-side code checks for the presence of `/custom/llmConfig.json` and if found, presents a custom LLM option to the user based on that configuration.

Below is an example `llmConfig.json` used for integration with OpenAI's public API.


```json
{
  "proxyUrl": "https://api.openai.com/",
  "userSettings": {"Model":"gpt-4o-mini", "API Key":"SECRET"},
  "completionUrl": "/custom/api/v1/chat/completions",
  "completionOptions": {
    "method": "POST",
    "headers": { 
      "Content-Type": "application/json", 
      "Authorization": "Bearer %API_KEY%"
    },
    "body": {
      "model": "%MODEL%",
      "temperature": 0,
      "max_tokens": 512,
      "seed": 0,
      "stream": true
    }
  },
  "maxRequestsPerMinute": 60
}
```

## proxyUrl

* The URL that will be proxied to for all requests to `/custom/api`.

You should only include the "proxyUrl" setting in your `llmConfig.json` file if you are using the Hone server Docker container and need the container to provide a same-origin proxy to your custom LLM endpoint. If in doubt, omit the "proxyUrl" setting until you know you need it.

When starting a Hone server Docker container, the "proxyUrl" setting will be used to configure Nginx to proxy `/custom/api/*` to the specified URL. If the custom LLM endpoint responds with CORS allowances for cross-origin requests, then you don't need the proxy, and you can omit the "proxyUrl" setting.

Care has been taken to avoid exposing the "proxyUrl" setting via the web host in the Docker container.

## userSettings

* User-editable settings for the custom LLM. The object can contain any number of name/value pairs.
* "name" in a name/value pair is the display text that will be shown to the user in a settings form.
* "value" in a name/value pair is the default value, changeable by the user in the form. If you are using this for a secret value, like a password or API key, use the reserved word "SECRET". This will cause the UI presented to the user to hide input for that value.

*Warning* Never put actual secrets in the `llmConfig.json` file because it will be publicly exposed via the web host.

When completion requests are made to the custom LLM, insertion points found in `llmConfig.json` (e.g., "%API_KEY%") will receive user setting values for settings that match the name (e.g. "API key"). The expected insertion point will just be the name in all-caps, spaces replaced with underscore, and prefixed/suffixed with "%". So "How I Met Your Mother" will have an insertion point of "%HOW_I_MET_YOUR_MOTHER%".

User settings can be stored in the browser's local storage if the user enables this option. Otherwise, they are only retained during a session. User settings are never stored on the Hone server.

## completionUrl

* The URL to which custom LLM completion requests can be made by Hone.
* If a proxy was configured (see "proxyUrl" setting), this should be "/custom/api/" followed by the path to the completion endpoint URL.
* Querystring values are supported, but when possible, I recommend using the "body" setting to pass values instead.
* You may use insertion points from user settings within the "completionUrl" setting, e.g., "example.com/myllm/%MODEL%/completion".

## completionOptions

* These options can be anything that is valid to pass in the second parameter of a Javascript `fetch()` call.
* You may use insertion points from user settings anywhere within the "completionOptions" setting.

I'll detail some of the possible members of `completionOptions`.

### .method

(the .method member under completionOptions)

* The HTTP method. Just specify it as "POST" unless you know you'll need something different.

### .headers

(the .header member under completionOptions)

* HTTP headers passed in each request. This is a likely place to include insertion points from user settings to handle authn/z.

### .body

(the .body member under completionOptions)

* The HTTP body of the completion request. It can be formatted many different ways to match the expected structure of the custom LLM completions API.
* Include the "stream" option or its equivalent as needed so that the completion API responds with a streaming response from the LLM.
* Hone automatically appends a "messages" array to the body at runtime, following OpenAI syntax. If you include a "messages" member in llmConfig.json, it will be ignored and will not override the default behavior.

Optional, but recommended:
* Include the "seed" option if the completion API supports it. This gives Hone more deterministic behavior useful for refining prompts or troubleshooting.
* Set temperature to "0" or a small number to bias the model to be more correct than creative.
* Set max tokens to "512" or some reasonable limit to protect against the model generating a very large number of tokens.

## maxRequestsPerMinute

* Set to maximum number of requests you want one client to send within one minute. 
* Or set to 0 to disable client-side throttling. This does not override any rate limits imposed by the LLM provider.

Hone will throttle on the *client* (user's web browser), not on the backend. So if you have multiple clients using the same custom LLM account, you may want more constrained throttling. 

Regardles of what setting you provide, if the custom LLM responds with HTTP 429 ("too many requests"), Hone will retry with a doubling delay and give up after some number of attempts.
