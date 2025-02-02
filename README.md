# Hone

An app for processing spreadsheet data with a local LLM. Try it out now at https://decentapps.net/hone .

The basic flow of using Hone is:

1. Import some data from a spreadsheet.
2. Ask a question to every row of the spreadsheet with a prompt template.
3. The LLM-provided answers to that question are filled into a new column of the spreadsheet.
4. Export the new column to your spreadsheet.

Importing and exporting can be done from standard spreadsheet files or via the clipboard. A nice way to use Hone is to have your spreadsheet app open, and just copy and paste values between Hone and the spreadsheet app.

## Features

* Import/export Excel (XLS, XLSX), CSV, and TSV files
* Copy and paste sheets with Excel, Google Sheets, and Numbers. Other spreadsheet software probably works too
* Design and test prompt templates quickly, inserting input fields from your spreadsheet
* View sheets with up 256 columns and as many rows as you have memory for.
* Prompt execution jobs can be paused and resumed
* Llama 3.2 8b model used for executing prompts, running in your browser (Thanks, [WebLLM](https://webllm.mlc.ai/)!)
* Example data and prompts included to try it out quickly
* Developed with high-security practices (limited dependencies, no service calls, no persistence of generated data)
* Fully open source

## It's Your Data, Not Mine

All the data you import or create within Hone stays on your device and only when you are using Hone. There are no calls to services, including the LLM. After the app loads, you could disable your Internet, and Hone would continue to work purely offline. You must explicitly export your generated data to keep it. Otherwise, it disappears when you close the browser tab for Hone.

I don't need to assure you that I won't sell your data to 3rd parties or use it to train AI models. Because I don't have your data! Only you do.

## Terminology

* LLM - large language model
* prompt - a question that can be asked to the LLM that will generate an answer
* prompt template - it's a prompt with insertion points used for adding input data. In Hone, the inputs come from per-row spreadsheet values.
* sheet - tabular data with columns and rows. A single Excel file can contain multiple sheets.

## Tips for Designing Prompt Templates

* Ask a question that boils down to single, concrete answer. E.g., "Is this object an animal, vegetable, or mineral?" rather than "Analyze and classify the object."
* To keep the LLM from spewing lots of text, it's good to specify constraints. E.g., "Output one of the following words 'animal', 'vegetable', or 'mineral' that best classifies the object." The verb "output" is especially useful for focusing the LLM.
* Don't use the LLM to do calcs (SUM(), AVERAGE(), etc). Your spreadsheet software will be faster and more reliable for this.
* Only add fields to your template that are useful for influencing the LLM's response. E.g., "What is the best gift for a child named {Name} who likes {Gift Preferences}?" is not as reliable or as fast as "What is the best gift for a child who likes {Gift Preferences}?" ("Name" field omitted from latter)
* Shorter prompt templates tend to take less time to execute. Execution time is influenced by the size of your prompt (prompt template with inserted values) and the response coming back.

If you find your prompt template going beyond a few sentences, consider breaking it into multiple prompts with the output of each going into a separate column. You can reuse these outputs as inputs to a prompt that synthesizes everything. An example using the Christmas Decisions example data: 

Prompt 1 - "Output a score from 1 (extremely naughty) to 100 (extremely nice) for a child with '{Feedback}' feedback." -> output to a "Moral Rectitude" column.
Prompt 2 - "Output a single gift name for a child with '{Gift Preferences}' preferences that has a value of ${Moral Rectitude} USD." -> output to a "Gift" column.

We run prompt 1 to give each child a "moral rectitude" score. We then use that output as an input to prompt 2. 

We could have instead combined these into a single prompt, e.g. "Output a single gift name for a child with '{Gift Preferences}' that has received '{Feedback}'. Gift value should be from $1 to $100 USD based on their feedback." But the results will be far less reliable. And we'll have less transparency on how gift decision was made.

If you are wondering if I actually want to use LLMs to evaluate children's moral rectitude, well... read the next section.

## Using LLM-Provided Data Responsibly

LLMs aren't magic. They're just good at predicting what text should follow some other text. The LLM used by Hone, like all the others, receives some input and generates output. It's what you, the human, does with that output that can be dangerous or harmful.

So for example, suppose you had a collection of job applications in a spreadsheet, and you asked Hone something like "Given all these inputs from the job application, output a score from 1 (never hire) to 10 (absolutely hire)." Decisions made like that could be terrible mistakes that hurt your company. You might also harm the future of deserving applicants that didn't fit the average profile of a successful jobseeker. In fact, you might even reinforce cultural biases that had become encoded into that average profile. The LLM was trained on the vast corpus of things people say on the Internet, and no matter how hard we scrub the LLM, it's just gonna reflect a lot of the mean and mistaken things people believe.

We hear a lot of talk about SkyNet-style AI takeovers and the universe being turned into paper clips. But I'm telling you, it's mainly the humans we have to worry about. And that includes you and me when we get up to something stupid. Please, pay attention to how you use LLM-generated data:

* Use prompts that ask clear questions with concrete answers. You should be able to judge for yourself if an answer from an LLM is correct or not.
* Be aware of cultural data that can exist in inputs like people's names or freeform writing and exclude from prompts unless needed.
* Put appropriate manual review on data that is used to make consequential decisions, e.g., if you're going to use LLM-generated data to judge a science fair entry, it's pretty important to confirm the data with your human eyes.
* If you're making decisions with generated data, design prompt templates to provide decision support information rather than making the decision itself.
* Avoid automating actions in the real world based on AI-generated data. Yes, you could use Hone to send a personalized newsletter to 10,000 people based on their LinkedIn profile data. But there is potential for a random hallucination to generate exactly the wrong words. And that might mean serious consequences to you - lawsuits, reputational damage, or guilt over pain you've caused.

## Support, Bugs, and Feature Requests

You can use [Github Issues](https://github.com/erikh2000/hone/issues) to file an issue.

But also, I want my baby app to do well in the World. Right now, in 2025, I'm motivated to work directly with you as a brand new Hone user. Consider reaching out to me as described in the "Contacting" section below.

## Licensing

My code and other files in this repository are licensed under the MIT open source license.

The fonts used by the template are hosted from decentapps.net rather than included in this repo. Their licensing is separate, but will be something compatible with open source, e.g., OFS SFIL. If you want to self-host the fonts rather load them from decentapps.net, the easiest thing might be to just find the same fonts from other sources and verify the licensing for your use. 

If you want to check the licensing I used for a hosted font, you can replace the filename of the URL that loads a WOFF or WOFF2 file with "LICENSE". So for example, the font served from "https://decentapps.net/fonts/hobby-of-night/hobby-of-night-webfont.woff2" was licensed to me according to terms found at "https://decentapps.net/fonts/hobby-of-night/LICENSE".

## Running a Local Server

The following steps show how to run Hone as a web server on your local device, for development or other non-production purposes:

1. `git clone git@github.com:erikh2000/hone.git` (clone the repo)
2. `cd hone` (change your working directory to the hone project directory)
3. `npm install` (installs dependencies needed to build the app)
4. `npm run fonts` (downloads a few fonts used by Hone so they can be served locally.)
5. `npm run dev` (launches the Vite web server, listening on port 3000 or another port if that is taken)
6. Browse to "http://localhost:3000" with your browser.

After the initial setup, just steps 5 and 6 are needed.

## Deploying to a Production Server

The following steps show how to deploy the Hone files to a production web server.

1. `git clone git@github.com:erikh2000/hone.git` (clone the repo)
2. `cd hone` (change your working directory to the hone project directory)
3. `npm install` (installs dependencies needed to build the app)
4. `npm run fonts` (downloads a few fonts used by Hone)
5. `npm run build` (creates all static content needed to serve Hone in the ./dist directory.)
6. Upload all the files under ./dist to the web-served directory on your production web server.

Some considerations:

* Hone is a purely static-content web app. So it really should be as simple as using `ftp`, `rsync`, `aws s3 cp`, or similar tool to copy the files to the right place.
* All paths are relative, so deploying to paths served with non-root URLs should work fine.
* Hone does make read-only fetches to some external hosts to download local LLM models. These are documented in `Dockerfile`.
* I do recommend using a CSP header to defend against potential supply chain attacks. Again, see the `Dockerfile` for an example.

## Creating a Docker Image

While you don't need a Docker image to build or run Hone, containerization can simplify deployments in many environments. The following steps show how to build and run a Docker image for Hone:

1. `git clone git@github.com:erikh2000/hone.git` (clone the repo)
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

I always welcome feedback. But on security, I double-welcome it! Please feel free to open an issue or contact me if you have any suggestions.

## Making Your Own Apps Like This

I am so excited about local-LLM web apps, that I made a project code generator for them. Basically, you can run "npx create-decent-app YourProjectName" from a terminal window, and it will give you functioning local-LLM web app that is ready to be modified to fit your vision. See my [create-decent-app Github repo](https://github.com/erikh2000/create-decent-app) for more info.

## Contributing

The project isn't open to contributions at this point. But that could change. Contact me if you'd like to collaborate.

## Contacting

You can reach me via my [LinkedIn profile](https://www.linkedin.com/in/erikhermansen/). I'll accept connections if you will just mention "hone" or some other shared interest in your connection request.

-Erik Hermansen