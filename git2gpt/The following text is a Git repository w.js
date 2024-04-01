


Groq docs:
```
Quickstart
----------

Get up and running with the Groq API in a few minutes.

### [Create an API Key](https://console.groq.com/docs/quickstart#create-an-api-key)

Please visit [here](https://console.groq.com/keys) to create an API Key.

### [Set up your API Key (recommended)](https://console.groq.com/docs/quickstart#set-up-your-api-key-recommended)

Configure your API key as an environment variable. This approach streamlines your API usage by eliminating the need to include your API key in each request. Moreover, it enhances security by minimizing the risk of inadvertently including your API key in your codebase.

#### In your terminal of choice:

CopyCopy code

```
export GROQ_API_KEY=<your-api-key-here>

```

### [Requesting your first chat completion](https://console.groq.com/docs/quickstart#requesting-your-first-chat-completion)

curl

JavaScript

Python

JSON

#### Install the Groq JavaScript library:

Copy

```
npm install --save groq-sdk
```

#### Performing a Chat Completion:

Copy

```
const Groq = require("groq-sdk");
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
async function main() {
    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: "Explain the importance of low latency LLMs"
            }
        ],
        model: "mixtral-8x7b-32768"
    });
    console.log(completion.choices[0]?.message?.content || "");
}
main();

```

Now that you have successfully received a chat completion, you can try out the other endpoints in the API.

### [Next Steps](https://console.groq.com/docs/quickstart#next-steps)

-   Check out the [Playground](https://console.groq.com/playground) to try out the APIs in your browser
-   Visit the GroqCloud [Discord](https://discord.gg/vK9Wqr9bDN)
-   [Chat with our Docs](https://docs-chat.groqcloud.com/) at lightning speed using the Groq API!

Chat Completion Models
----------------------

The Groq Chat Completions API processes a series of messages and generates output responses. These models can perform multi-turn discussions or tasks that require only one interaction.

### [Required Parameters](https://console.groq.com/docs/text-chat#required-parameters)

-   model: The language model which will perform the completion. See the [models](https://console.groq.com/docs/models) to learn more about available models.
-   messages: A list of messages in the conversation so far. Each message is an object that has the following fields:
    -   role:
        -   system: sets the behavior of the assistant and can be used to provide specific instructions for how it should behave throughout the conversation.
        -   user: Messages written by a user of the LLM.
        -   assistant: Messages written by the LLM in a previous completion.
        -   other message types are not currently supported
    -   content: The text of a message.
    -   name: An optional name to disambiguate messages from different users with the same role.
    -   seed: Seed used for sampling. Groq attempts to return the same response to the same request with an identical seed.

### [Optional Parameters](https://console.groq.com/docs/text-chat#optional-parameters)

-   temperature: Controls randomness of responses. A lower temperature leads to more predictable outputs while a higher temperature results in more varies and sometimes more creative outputs.
-   max_tokens: The maximum number of tokens that the model can process in a single response. This limits ensures computational efficiency and resource management.
-   top_p: A method of text generation where a model will only consider the most probable next tokens that make up the probability p. 0.5 means half of all likelihood-weighted options are considered.
-   stream: User server-side events to send the completion in small deltas rather than in a single batch after all processing has finished. This reduces the time to first token received.
-   stop: A stop sequence is a predefined or user-specified text string that signals an AI to stop generating content, ensuring its responses remain focused and concise.

### [JSON mode *(beta)*](https://console.groq.com/docs/text-chat#json-mode-object-object)

JSON mode is a beta feature that guarantees all chat completions are valid JSON.

Usage:

-   Set `"response_format": {"type": "json_object"}` in your chat completion request
-   Add a description of the desired JSON structure within the system prompt (see below for example system prompts)

Recommendations for best beta results:

-   Mixtral performs best at generating JSON, followed by Gemma, then Llama
-   Use pretty-printed JSON instead of compact JSON
-   Keep prompts concise

Beta Limitations:

-   Does not support streaming
-   Does not support stop sequences

Error Code:

-   Groq will return a 400 error with an error code of `json_validate_failed` if JSON generation fails.

Example system prompts:

CopyCopy code

```
You are a legal advisor who summarizes documents in JSON

```

CopyCopy code

```
You are a data analyst API capable of sentiment analysis that responds in JSON.  The JSON schema should include {
    "sentiment_analysis": {
        "sentiment": "string (positive, negative, neutral)",
        "confidence_score": "number (0-1)"
        # Include additional fields as required
   }

```

### [Generating Chat Completions with groq SDK](https://console.groq.com/docs/text-chat#generating-chat-completions-with-groq-sdk)

#### Code Overview

Python

JavaScript

Copy

```
npm install --save groq-sdk
```

### [Performing a basic Chat Completion](https://console.groq.com/docs/text-chat#performing-a-basic-chat-completion)

Copy

```
const Groq = require("groq-sdk");
const groq = new Groq();
async function main() {
    groq.chat.completions.create({
        //
        // Required parameters
        //
        messages: [
            // Set an optional system message. This sets the behavior of the
            // assistant and can be used to provide specific instructions for
            // how it should behave throughout the conversation.
            {
                role: "system",
                content: "you are a helpful assistant."
            },
            // Set a user message for the assistant to respond to.
            {
                role: "user",
                content: "Explain the importance of low latency LLMs"
            }
        ],
        // The language model which will generate the completion.
        model: "mixtral-8x7b-32768",
        //
        // Optional parameters
        //
        // Controls randomness: lowering results in less random completions.
        // As the temperature approaches zero, the model will become deterministic
        // and repetitive.
        temperature: 0.5,
        // The maximum number of tokens to generate. Requests can use up to
        // 2048 tokens shared between prompt and completion.
        max_tokens: 1024,
        // Controls diversity via nucleus sampling: 0.5 means half of all
        // likelihood-weighted options are considered.
        top_p: 1,
        // A stop sequence is a predefined or user-specified text string that
        // signals an AI to stop generating content, ensuring its responses
        // remain focused and concise. Examples include punctuation marks and
        // markers like "[end]".
        stop: null,
        // If set, partial message deltas will be sent.
        stream: false
    }).then((chatCompletion)=>{
        // Print the completion returned by the LLM.
        process.stdout.write(chatCompletion.choices[0]?.message?.content || "");
    });
}
main();

```

### [Streaming a Chat Completion](https://console.groq.com/docs/text-chat#streaming-a-chat-completion)

To stream a completion, simply set the parameter `stream=True`. Then the completion function will return an iterator of completion deltas rather than a single, full completion.

Copy

```
const Groq = require("groq-sdk");
const groq = new Groq();
async function main() {
    groq.chat.completions.create({
        //
        // Required parameters
        //
        messages: [
            // Set an optional system message. This sets the behavior of the
            // assistant and can be used to provide specific instructions for
            // how it should behave throughout the conversation.
            {
                role: "system",
                content: "you are a helpful assistant."
            },
            // Set a user message for the assistant to respond to.
            {
                role: "user",
                content: "Explain the importance of low latency LLMs"
            }
        ],
        // The language model which will generate the completion.
        model: "mixtral-8x7b-32768",
        //
        // Optional parameters
        //
        // Controls randomness: lowering results in less random completions.
        // As the temperature approaches zero, the model will become deterministic
        // and repetitive.
        temperature: 0.5,
        // The maximum number of tokens to generate. Requests can use up to
        // 2048 tokens shared between prompt and completion.
        max_tokens: 1024,
        // Controls diversity via nucleus sampling: 0.5 means half of all
        // likelihood-weighted options are considered.
        top_p: 1,
        // A stop sequence is a predefined or user-specified text string that
        // signals an AI to stop generating content, ensuring its responses
        // remain focused and concise. Examples include punctuation marks and
        // markers like "[end]".
        stop: null,
        // If set, partial message deltas will be sent.
        stream: false
    }).then((chatCompletion)=>{
        // Print the completion returned by the LLM.
        process.stdout.write(chatCompletion.choices[0]?.message?.content || "");
    });
}
main();

```

### [Streaming a chat completion with a stop sequence](https://console.groq.com/docs/text-chat#streaming-a-chat-completion-with-a-stop-sequence)

Copy

```
const Groq = require("groq-sdk");
const groq = new Groq();
async function main() {
    const stream = await groq.chat.completions.create({
        //
        // Required parameters
        //
        messages: [
            // Set an optional system message. This sets the behavior of the
            // assistant and can be used to provide specific instructions for
            // how it should behave throughout the conversation.
            {
                role: "system",
                content: "you are a helpful assistant."
            },
            // Set a user message for the assistant to respond to.
            {
                role: "user",
                content: "Start at 1 and count to 10.  Separate each number with a comma and a space"
            }
        ],
        // The language model which will generate the completion.
        model: "mixtral-8x7b-32768",
        //
        // Optional parameters
        //
        // Controls randomness: lowering results in less random completions.
        // As the temperature approaches zero, the model will become deterministic
        // and repetitive.
        temperature: 0.5,
        // The maximum number of tokens to generate. Requests can use up to
        // 2048 tokens shared between prompt and completion.
        max_tokens: 1024,
        // Controls diversity via nucleus sampling: 0.5 means half of all
        // likelihood-weighted options are considered.
        top_p: 1,
        // A stop sequence is a predefined or user-specified text string that
        // signals an AI to stop generating content, ensuring its responses
        // remain focused and concise. Examples include punctuation marks and
        // markers like "[end]".
        //
        // For this example, we will use ", 6" so that the llm stops counting at 5.
        // If multiple stop values are needed, an array of string may be passed,
        // stop: [", 6", ", six", ", Six"]
        stop: ", 6",
        // If set, partial message deltas will be sent.
        stream: true
    });
    for await (const chunk of stream){
        // Print the completion returned by the LLM.
        process.stdout.write(chunk.choices[0]?.delta?.content || "");
    }
}
main();

```

### [JSON Mode](https://console.groq.com/docs/text-chat#json-mode)

Copy

```
const Groq = require("groq-sdk");
const groq = new Groq();
const schema = {
    $defs: {
        Ingredient: {
            properties: {
                name: {
                    title: "Name",
                    type: "string"
                },
                quantity: {
                    title: "Quantity",
                    type: "string"
                },
                quantity_unit: {
                    anyOf: [
                        {
                            type: "string"
                        },
                        {
                            type: "null"
                        }
                    ],
                    title: "Quantity Unit"
                }
            },
            required: [
                "name",
                "quantity",
                "quantity_unit"
            ],
            title: "Ingredient",
            type: "object"
        }
    },
    properties: {
        recipe_name: {
            title: "Recipe Name",
            type: "string"
        },
        ingredients: {
            items: {
                $ref: "#/$defs/Ingredient"
            },
            title: "Ingredients",
            type: "array"
        },
        directions: {
            items: {
                type: "string"
            },
            title: "Directions",
            type: "array"
        }
    },
    required: [
        "recipe_name",
        "ingredients",
        "directions"
    ],
    title: "Recipe",
    type: "object"
};
class Ingredient {
    constructor(name, quantity, quantity_unit){
        this.name = name;
        this.quantity = quantity;
        this.quantity_unit = quantity_unit || null;
    }
}
class Recipe {
    constructor(recipe_name, ingredients, directions){
        this.recipe_name = recipe_name;
        this.ingredients = ingredients;
        this.directions = directions;
    }
}
async function getRecipe(recipe_name) {
    // Pretty printing improves completion results.
    jsonSchema = JSON.stringify(schema, null, 4);
    const chat_completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are a recipe database that outputs recipes in JSON.\n'The JSON object must use the schema: ${jsonSchema}`
            },
            {
                role: "user",
                content: `Fetch a recipe for ${recipe_name}`
            }
        ],
        model: "mixtral-8x7b-32768",
        stream: false,
        response_format: {
            type: "json_object"
        }
    });
    return Object.assign(new Recipe(), JSON.parse(chat_completion.choices[0].message.content));
}
function printRecipe(recipe) {
    console.log("Recipe:", recipe.recipe_name);
    console.log();
    console.log("Ingredients:");
    recipe.ingredients.forEach((ingredient)=>{
        console.log(`- ${ingredient.name}: ${ingredient.quantity} ${ingredient.quantity_unit || ""}`);
    });
    console.log();
    console.log("Directions:");
    recipe.directions.forEach((direction, step)=>{
        console.log(`${step + 1}. ${direction}`);
    });
}
async function main() {
    const recipe = await getRecipe("apple pie");
    printRecipe(recipe);
}
main();
```

Groq client libraries
---------------------

Groq provides both a Python and JavaScript/Typescript client library.

Python

JavaScript

### [Groq JavaScript API Library](https://console.groq.com/docs/libraries#groq-javascript-api-library)

The Groq JavaScript library provides convenient access to the Groq REST API from server-side TypeScript or JavaScript.

The library includes type definitions for all request params and response fields, and offers both synchronous and asynchronous clients.

Installation
------------

Copy

```
npm install --save groq-sdk
```

Usage
-----

Use the library and your secret key to run:

Copy

```
const Groq = require("groq-sdk");
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
async function main() {
    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: "Explain the importance of low latency LLMs"
            }
        ],
        model: "mixtral-8x7b-32768"
    }).then((chatCompletion)=>{
        process.stdout.write(chatCompletion.choices[0]?.message?.content || "");
    });
}
main();

```

The following response is generated:

Copy

```
{
  "id": "34a9110d-c39d-423b-9ab9-9c748747b204",
  "object": "chat.completion",
  "created": 1708045122,
  "model": "mixtral-8x7b-32768",
  "system_fingerprint": null,
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Low latency Large Language Models (LLMs) are important in the field of artificial intelligence and natural language processing (NLP) for several reasons:\n\n1. Real-time applications: Low latency LLMs are essential for real-time applications such as chatbots, voice assistants, and real-time translation services. These applications require immediate responses, and high latency can lead to a poor user experience.\n\n2. Improved user experience: Low latency LLMs provide a more seamless and responsive user experience. Users are more likely to continue using a service that provides quick and accurate responses, leading to higher user engagement and satisfaction.\n\n3. Competitive advantage: In today's fast-paced digital world, businesses that can provide quick and accurate responses to customer inquiries have a competitive advantage. Low latency LLMs can help businesses respond to customer inquiries more quickly, potentially leading to increased sales and customer loyalty.\n\n4. Better decision-making: Low latency LLMs can provide real-time insights and recommendations, enabling businesses to make better decisions more quickly. This can be particularly important in industries such as finance, healthcare, and logistics, where quick decision-making can have a significant impact on business outcomes.\n\n5. Scalability: Low latency LLMs can handle a higher volume of requests, making them more scalable than high-latency models. This is particularly important for businesses that experience spikes in traffic or have a large user base.\n\nIn summary, low latency LLMs are essential for real-time applications, providing a better user experience, enabling quick decision-making, and improving scalability. As the demand for real-time NLP applications continues to grow, the importance of low latency LLMs will only become more critical."
      },
      "finish_reason": "stop",
      "logprobs": null
    }
  ],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 377,
    "total_tokens": 401,
    "prompt_time": 0.009,
    "completion_time": 0.774,
    "total_time": 0.783
  }
}

```

`\
`

Supported Models
----------------

GroqCloud currently supports the following models:

### [LLaMA2 70b](https://console.groq.com/docs/models#llama2-70b)

-   Model ID: `llama2-70b-4096`
-   Developer: Meta
-   Context Window: 4,096 tokens
-   Model Card: `https://huggingface.co/meta-llama/Llama-2-70b`

### [Mixtral 8x7b](https://console.groq.com/docs/models#mixtral-8x7b)

-   Model ID: `mixtral-8x7b-32768`
-   Developer: Mistral
-   Context Window: 32,768 tokens
-   Model Card: `https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1`

### [Gemma 7b](https://console.groq.com/docs/models#gemma-7b)

-   Model ID: `gemma-7b-it`
-   Developer: Google
-   Context Window: 8,192 tokens
-   Model Card: `https://huggingface.co/google/gemma-7b-it`

These are chat type models and are directly accessible through the GroqCloud Models API endpoint using the model IDs mentioned above.





deepgram docs:
```


Getting started
===============

An introduction to getting transcription data from live streaming audio in real time using Deepgram's SDKs.

In this guide, you'll learn how to automatically transcribe live streaming audio in real time using Deepgram's SDKs, which are supported for use with the [Deepgram API](https://developers.deepgram.com/reference/).

> 📘
> --
>
> Before you run the code, you'll need to follow the steps in [this guide](https://developers.deepgram.com/docs/make-your-first-api-request) to create a Deepgram account, get a Deepgram API key, configure your environment, and install the SDK of your choice.

Transcribe Audio

[](https://developers.deepgram.com/reference/getting-started-with-live-streaming-audio#transcribe-audio)
----------------------------------------------------------------------------------------------------------------------------

Follow the steps to transcribe audio from a remote audio stream. If you would like to learn how to stream audio from a microphone, check out our [Live Audio Starter Apps](https://developers.deepgram.com/docs/stt-streaming-feature-overview) or specific examples in the readme of each of the [Deepgram SDKs](https://developers.deepgram.com/docs/deepgram-sdks).

> 🌈
> --
>
> For those who prefer to work from a Jupyter notebook, check out our [Python Starter Notebooks](https://developers.deepgram.com/docs/python-notebooks).

###

Install the SDK
`

[](https://developers.deepgram.com/reference/getting-started-with-live-streaming-audio#install-the-sdk)

Open your terminal, navigate to the location on your drive where you want to create your project, and install the Deepgram SDK:

# Install the Deepgram JavaScript SDK
# https://github.com/deepgram/deepgram-node-sdk

npm install @deepgram/sdk
`

###

Add Dependencies

[](https://developers.deepgram.com/reference/getting-started-with-live-streaming-audio#add-dependencies)

Add necessary external dependencies to your project.

PythonJavaScriptC#Go

`
# Install cross-fetch: Platform-agnostic Fetch API with typescript support, a simple interface, and optional polyfill.
# Install dotenv to protect your api key

npm install cross-fetch dotenv
`

###

Write the Code

[](https://developers.deepgram.com/reference/getting-started-with-live-streaming-audio#write-the-code)

In your terminal, create a new file in your project's location, and populate it with code.

PythonJavaScriptC#Go

`
// Example filename: index.js

const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const fetch = require("cross-fetch");
const dotenv = require("dotenv");
dotenv.config();

// URL for the realtime streaming audio you would like to transcribe
const url = "http://stream.live.vc.bbcmedia.co.uk/bbc_world_service";

const live = async () => {
  // STEP 1: Create a Deepgram client using the API key
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

  // STEP 2: Create a live transcription connection
  const connection = deepgram.listen.live({
    model: "nova-2",
    language: "en-US",
    smart_format: true,
  });

  // STEP 3: Listen for events from the live transcription connection
  connection.on(LiveTranscriptionEvents.Open, () => {
    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log("Connection closed.");
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      console.log(data.channel.alternatives[0].transcript);
    });

    connection.on(LiveTranscriptionEvents.Metadata, (data) => {
      console.log(data);
    });

    connection.on(LiveTranscriptionEvents.Error, (err) => {
      console.error(err);
    });

    // STEP 4: Fetch the audio stream and send it to the live transcription connection
    fetch(url)
      .then((r) => r.body)
      .then((res) => {
        res.on("readable", () => {
          connection.send(res.read());
        });
      });
  });
};

live();
`

> ℹ️
> --
>
> The above example includes the parameter `model=nova-2`, which tells the API to use Deepgram's most powerful and affordable model. Removing this parameter will result in the API using the default model, which is currently `model=base`.
>
> It also includes Deepgram's [Smart Formatting](https://developers.deepgram.com/docs/smart-format) feature, `smart_format=true`. This will format currency amounts, phone numbers, email addresses, and more for enhanced transcript readability.

###

# Run your application using the file you created in the previous step
# Example: node index.js

node YOUR_PROJECT_NAME.js
`

# Run your application using the file you created in the previous step
# Example: python main.py

python YOUR_PROJECT_NAME.py

`

###

See Results

[](https://developers.deepgram.com/reference/getting-started-with-live-streaming-audio#see-results)

Your transcripts will appear in your browser's developer console. Keep in mind that Deepgram does not store transcriptions. Make sure to save the output or [return transcriptions to a callback URL for custom processing](https://developers.deepgram.com/docs/callback/).

By default, Deepgram live streaming looks for any deviation in the natural flow of speech and returns a finalized response at these places. To learn more about this feature, see [Endpointing](https://developers.deepgram.com/docs/endpointing/).

Deepgram live streaming can also return a series of interim transcripts followed by a final transcript. To learn more, see [Interim Results](https://developers.deepgram.com/docs/interim-results/).

> ℹ️
> --
>
> Endpointing can be used with Deepgram's [Interim Results](https://developers.deepgram.com/docs/interim-results/) feature. To compare and contrast these features, and to explore best practices for using them together, see [Using Endpointing and Interim Results with Live Streaming Audio](https://developers.deepgram.com/docs/understand-endpointing-interim-results/).

Endpointing
===========

Endpointing returns transcripts when pauses in speech are detected.

[Suggest Edits](https://developers.deepgram.com/edit/endpointing)

`endpointing` *string*.

Pre-recorded [Streaming](https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio) [All available languages](https://developers.deepgram.com/docs/models-languages-overview)

Deepgram's Endpointing feature monitors incoming streaming audio and detects sufficiently long pauses that are likely to represent an endpoint in speech. When Deepgram detects an endpoint, it assumes that no additional data will improve its prediction, so it immediately finalizes its results for the processed time range and returns the transcript with a `speech_final` parameter set to `true`.

Endpointing relies on a Voice Activity Detector, which monitors the incoming audio and triggers when a sufficiently long pause is detected.

You can customize the length of time used to detect whether a speaker has finished speaking by setting the `endpointing` parameter to an integer value. By default, Deepgram uses 10 milliseconds.

> ℹ️
> --
>
> Endpointing can be used with Deepgram's [Interim Results](https://developers.deepgram.com/docs/interim-results/) feature. To compare and contrast these features, and to explore best practices for using them together, see [Using Endpointing and Interim Results with Live Streaming Audio](https://developers.deepgram.com/docs/understand-endpointing-interim-results/).

Enable Feature

[](https://developers.deepgram.com/docs/endpointing#enable-feature)
-------------------------------------------------------------------------------------

By default, endpointing is enabled and will return transcripts after detecting 10 milliseconds of silence. When endpointing is enabled, once a speaker finishes speaking, no transcripts will be sent back until the speech resumes or the required amount of silence has been detected. Once either of those conditions are met, a transcript with `speech_final=true` will be sent back.

The period of silence required for endpointing may be configured. When you call Deepgram's API, add an `endpointing` parameter set to an integer by setting endpointing to an integer representing a millisecond value:

`endpointing=500`

This will wait until 500 milliseconds of silence has passed to finalize and return transcripts.

Endpointing may be disabled by setting `endpointing=false`. If endpointing is disabled, transcriptions will be returned at a cadence determined by Deepgram's chunking algorithms.

> 📘
> --
>
> For an example of audio streaming, see [Getting Started with Streaming Audio](https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio).

Results

[](https://developers.deepgram.com/docs/endpointing#results)
-----------------------------------------------------------------------

When enabled, the transcript for each received streaming response shows a key called `speech_final`.

JSON

`

{
  "channel_index":[
    0,
    1
  ],
  "duration":1.039875,
  "start":0.0,
  "is_final":false,
  "speech_final":false,
  "channel":{
    "alternatives":[
      {
        "transcript":"another big",
        "confidence":0.9600255,
        "words":[
          {
            "word":"another",
            "start":0.2971154,
            "end":0.7971154,
            "confidence":0.9588303
          },
          {
            "word":"big",
            "start":0.85173076,
            "end":1.039875,
            "confidence":0.9600255
          }
        ]
      }
    ]
  }
}
...

`

When `speech_final` is set to `true`, Deepgram has detected an endpoint and immediately finalized its results for the processed time range.

In Practice

[](https://developers.deepgram.com/docs/endpointing#in-practice)
-------------------------------------------------------------------------------

Examples for using Endpointing:

-   When set to lower values, returning finalized transcripts as soon as possible when a break in speech is detected.
-   When set to higher values, indicating that the speaker may have ended their thought.

> ℹ️
> --
>


What's Next?

[](https://developers.deepgram.com/reference/getting-started-with-live-streaming-audio#whats-next)
------------------------------------------------------------------------------------------------------------------

Now that you've gotten transcripts for streaming audio, enhance your knowledge by exploring the following areas. You can also check out our [Live Streaming API Reference](https://developers.deepgram.com/reference/streaming) for a list of all possible parameters.

###

Try the Starter Apps

[](https://developers.deepgram.com/reference/getting-started-with-live-streaming-audio#try-the-starter-apps)

Clone and run one of our [Live Audio Starter App](https://developers.deepgram.com/docs/starter-apps) repositories to see a full application with a frontend UI and a backend server streaming audio to Deepgram.

###

Read the Feature Guides

[](https://developers.deepgram.com/reference/getting-started-with-live-streaming-audio#read-the-feature-guides)

Deepgram's features help you to customize your transcripts. Do you want to transcribe audio in other languages? Check out the [Language](https://developers.deepgram.com/docs/language) feature guide. Do you want to remove profanity from the transcript or redact personal information such as credit card numbers? Check out [Profanity Filtering](https://developers.deepgram.com/docs/profanity-filter) or [Redaction](https://developers.deepgram.com/docs/redaction).

Take a glance at our [Feature Overview](https://developers.deepgram.com/docs/stt-streaming-feature-overview) for streaming speech-to-text to see the list of all the features available. Then read more about each feature in its individual guide.

###

Add Your Audio

[](https://developers.deepgram.com/reference/getting-started-with-live-streaming-audio#add-your-audio)

Ready to connect Deepgram to your own audio source? Start by reviewing [how to determine your audio format](https://developers.deepgram.com/docs/determining-your-audio-format-for-live-streaming-audio/) and format your API request accordingly.

Then, you'll want to check out our [Live Streaming Starter Kit](https://developers.deepgram.com/docs/getting-started-with-the-streaming-test-suite). It's the perfect "102" introduction to integrating your own audio.

###

Explore Use Cases

[](https://developers.deepgram.com/reference/getting-started-with-live-streaming-audio#explore-use-cases)

Learn about the different ways you can use Deepgram products to help you meet your business objectives. [Explore Deepgram's use cases](https://developers.deepgram.com/use-cases/).

###

Transcribe Pre-recorded Audio

[](https://developers.deepgram.com/reference/getting-started-with-live-streaming-audio#transcribe-pre-recorded-audio)

Now that you know how to transcribe streaming audio, check out how you can use Deepgram to transcribe pre-recorded audio. To learn more, see [Getting Started with Pre-recorded Audio](https://developers.deepgram.com/docs/getting-started-with-pre-recorded-audio/).
```



example deepgram code (Live Streaming):
```
The following text is a Git repository with code. The structure of the text are sections that begin with ----, followed by a single line containing the file path and file name, followed by a variable amount of lines containing the file contents. The text representing the Git repository ends when the symbols --END-- are encounted. Any further text beyond --END-- are meant to be interpreted as instructions using the aforementioned Git repository as context.
----
README.md
# Live Node Starter

[![Discord](https://dcbadge.vercel.app/api/server/xWRaCDBtW4?style=flat)](https://discord.gg/xWRaCDBtW4)

This sample demonstrates interacting with the Deepgram live streaming API from a Node.js server.

## What is Deepgram?

[Deepgram](https://deepgram.com/) is a foundational AI company providing speech-to-text and language understanding capabilities to make data readable and actionable by human or machines.

## Sign-up to Deepgram

Before you start, it's essential to generate a Deepgram API key to use in this project. [Sign-up now for Deepgram and create an API key](https://console.deepgram.com/signup?jump=keys).

## Quickstart

### Manual

Follow these steps to get started with this starter application.

#### Clone the repository

Go to GitHub and [clone the repository](https://github.com/deepgram-starters/live-node-starter).

#### Install dependencies

Install the project dependencies.

```bash
npm install
```

#### Edit the config file

Copy the code from `sample.env` and create a new file called `.env`. Paste in the code and enter your API key you generated in the [Deepgram console](https://console.deepgram.com/).

```js
DEEPGRAM_API_KEY=%api_key%
```

#### Select branch

The `main` branch demonstrates a native websockets implementation. Switch to the `socket-io` branch to see a version using socket.io.

```bash
git checkout socket-io
```

#### Run the application

The `start` script will run a web and API server concurrently. Once running, you can [access the application in your browser](http://localhost:3000/).

```bash
npm run start
```

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Security Policy](./SECURITY.md) details the procedure for contacting Deepgram.

## Getting Help

We love to hear from you so if you have questions, comments or find a bug in the project, let us know! You can either:

- [Open an issue in this repository](https://github.com/deepgram-starters/live-node-starter/issues/new)
- [Join the Deepgram Github Discussions Community](https://github.com/orgs/deepgram/discussions)
- [Join the Deepgram Discord Community](https://discord.gg/xWRaCDBtW4)

## Author

[Deepgram](https://deepgram.com)

## License

This project is licensed under the MIT license. See the [LICENSE](./LICENSE) file for more info.

----
deepgram.toml
[meta]
  title = "<usecase> <language/framework> Starter" # update with usecase and framework
  description = "Basic demo for using Deepgram to <do a thing> in <language/framework>" # update with usecase and framework
  author = "Deepgram DX Team <devrel@deepgram.com> (https://developers.deepgram.com)" # update for author details
  useCase = "Prerecorded" # usecase
  language = "Python" # base language
  framework = "Flask" # framework if not native

[build] # delete if no build/install steps applicable 
  command = "pip install -r requirements.txt" # automatically install dependencies, delete if not applicable

[config]
  sample = "sample.env" # the example config file
  output = ".env" # the file that we will generate using their API

[post-build]
  message = "Run `flask run -p 8080` to get up and running." # message to give users once setup is complete
----
package.json
{
  "name": "live-node-starter",
  "version": "1.0.0",
  "description": "A project to get up and running with Deepgram's livestream speech-to-text API",
  "main": "server.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/deepgram-starters/live-node-starter.git"
  },
  "keywords": [
    "speech-to-text",
    "deepgram",
    "streaming"
  ],
  "author": "Deepgram",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/deepgram-starters/live-node-starter/issues"
  },
  "homepage": "https://github.com/deepgram-starters/live-node-starter#readme",
  "dependencies": {
    "@deepgram/sdk": "^3.0.1",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "ws": "^8.16.0"
  }
}

----
public\client.js
const captions = window.document.getElementById("captions");

async function getMicrophone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return new MediaRecorder(stream, { mimeType: "audio/webm" });
  } catch (error) {
    console.error("error accessing microphone:", error);
    throw error;
  }
}

async function openMicrophone(microphone, socket) {
  return new Promise((resolve) => {
    microphone.onstart = () => {
      console.log("client: microphone opened");
      document.body.classList.add("recording");
      resolve();
    };

    microphone.onstop = () => {
      console.log("client: microphone closed");
      document.body.classList.remove("recording");
    };

    microphone.ondataavailable = (event) => {
      console.log("client: microphone data received");
      if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      }
    };

    microphone.start(1000);
  });
}

async function closeMicrophone(microphone) {
  microphone.stop();
}

async function start(socket) {
  const listenButton = document.querySelector("#record");
  let microphone;

  console.log("client: waiting to open microphone");

  listenButton.addEventListener("click", async () => {
    if (!microphone) {
      try {
        microphone = await getMicrophone();
        await openMicrophone(microphone, socket);
      } catch (error) {
        console.error("error opening microphone:", error);
      }
    } else {
      await closeMicrophone(microphone);
      microphone = undefined;
    }
  });
}

window.addEventListener("load", () => {
  const socket = new WebSocket("ws://localhost:3000");

  socket.addEventListener("open", async () => {
    console.log("client: connected to server");
    await start(socket);
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.channel.alternatives[0].transcript !== "") {
      captions.innerHTML = data
        ? `<span>${data.channel.alternatives[0].transcript}</span>`
        : "";
    }
  });

  socket.addEventListener("close", () => {
    console.log("client: disconnected from server");
  });
});

----
public\index.html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Deepgram Test</title>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />
    <link rel="stylesheet" href="style.css" />
  </head>
  <body class="">
    <div class="content">
      <img class="click" src="click.png" />
      <div class="button-container">
        <input type="checkbox" id="record" class="mic-checkbox" />
        <label for="record" class="mic-button">
          <div class="mic">
            <div class="mic-button-loader"></div>
            <div class="mic-base"></div>
          </div>
          <div class="button-message">
            <span>&nbsp;</span>
            <span> START </span>
          </div>
        </label>
      </div>
    </div>
    <h1>Captions by Deepgram</h1>
    <div class="captions" id="captions">
      <span>Realtime speech transcription API</span>
    </div>
    <div class="button-container">
      <a
        href="https://console.deepgram.com/signup"
        class="info-button sign-up"
        target="_blank"
        >Sign Up</a
      >
      <a
        href="https://developers.deepgram.com/docs/introduction"
        class="info-button docs"
        target="_blank"
        >Read the Docs</a
      >
    </div>
    <script src="client.js"></script>
  </body>
</html>

----
public\style.css
/* @import url(https://fonts.googleapis.com/css?family=Montserrat); */
@import url("https://fonts.googleapis.com/css2?family=Arimo:wght@400;600;700");
@import url("https://fonts.googleapis.com/css2?family=Inter");

body {
  color: white;
  display: flex;
  align-items: center;
  font-family: "Inter", sans-serif;
  justify-content: center;
  flex-direction: column;
  height: 90vh;
  background-color: #000;
  padding-top: 100px;
}

.content {
  display: flex;
  height: 30vh;
  position: relative;
  align-items: center;
}

.mic-checkbox {
  display: none;
}

.mic-checkbox:checked + .mic-button {
  transform: rotateY(180deg);
}

.button-container {
  perspective: 500px;
  -moz-perspective: 500px;
  -webkit-perspective: 500px;
}

.mic-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  width: 200px;
  border-radius: 100%;
  transition: transform 0.4s;
  border: 2px solid #47aca9;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  -moz-transform-style: preserve-3d;
  position: relative;
}

.button-message,
.mic {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  -moz-backface-visibility: hidden;
}

.button-message {
  position: absolute;
  width: 50px;
  color: #fff;
  font-family: "Arimo", sans-serif;
  font-weight: 700;
  font-size: 25px;
  text-align: center;
  line-height: 20px;
  z-index: 2;
  transform: rotateY(0deg);
  pointer-events: none;
  left: 58px;
  top: 71px;
}

.mic-button-loader {
  position: absolute;
  height: 202px;
  width: 200px;
  background-color: transparent;
  transform: rotateY(180deg);
  top: -61px;
  left: -101px;
}

.mic-checkbox:checked + .mic-button > .mic > .mic-button-loader {
  border-top: 2.5px solid #13ef95;
  border-radius: 100%;
  animation: borderLoader 1.3s 0.2s ease-in-out infinite;
}

.mic {
  position: relative;
  top: -17px;
  border: 20px solid #47aca9;
  height: 48px;
  width: 0;
  border-radius: 45px;
  transform: rotateY(180deg);
}

.mic:after,
.mic:before,
.mic-base {
  position: absolute;
}

.mic:after {
  content: "";
  top: 16px;
  left: -30px;
  height: 57px;
  width: 50px;
  background-color: transparent;
  border: 5px solid #47aca9;
  border-bottom-left-radius: 102px;
  border-bottom-right-radius: 110px;
  border-top: 0;
}

.mic:before {
  content: "";
  top: 77px;
  left: -2px;
  border-bottom: 18px solid #47aca9;
  border-left: 3px solid #47aca9;
  border-right: 3px solid #47aca9;
}

.mic-base {
  top: 95px;
  left: -14px;
  border-bottom: 7px solid #47aca9;
  border-left: 15px solid #47aca9;
  border-right: 15px solid #47aca9;
}

@keyframes borderLoader {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}

#captions {
  color: rgb(237, 237, 242);
  font-size: 24px;
  font-family: "Inter", sans-serif;
  margin: 10px 0;
  text-align: center;
}

h1 {
  font-family: "Arimo", sans-serif;
  font-size: 40px;
  margin-top: 60px;
  letter-spacing: -0.02em;
  opacity: 1;
  text-align: center;
}

.button-container {
  display: flex;
  gap: 16px;
}

.info-button {
  display: flex;
  align-items: center;
  color: black;
  height: 40px;
  border-radius: 4px;
  padding: 0 16px;
  margin-top: 32px;
  font-family: "Arimo", sans-serif;
  font-weight: 600;
  text-decoration: none;
}

.sign-up {
  color: white;
  position: relative;
  background-origin: border-box;
  background-image: linear-gradient(90deg, #201cff -91.5%, #13ef95 80.05%);
  box-shadow: 2px 1000px 1px var(--md-code-background) inset;
  z-index: 1;
}

.sign-up::before {
  content: "";
  border-radius: 4px;
  position: absolute;
  top: 1px;
  right: 1px;
  bottom: 1px;
  left: 1px;
  background-color: black;
  z-index: -1;
}

.docs {
  background-color: white;
}

.docs::after {
  font-family: FontAwesome;
  font-weight: 900;
  content: "\f061";
  margin-right: -4px;
  margin-left: 8px;
}

.click {
  position: absolute;
  height: 150px;
  left: 20px;
  top: -144px;
}

----
sample.env
DEEPGRAM_API_KEY=%api_key%
----
server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
let keepAlive;

const setupDeepgram = (ws) => {
  const deepgram = deepgramClient.listen.live({
    language: "en",
    punctuate: true,
    smart_format: true,
    model: "nova",
  });

  if (keepAlive) clearInterval(keepAlive);
  keepAlive = setInterval(() => {
    console.log("deepgram: keepalive");
    deepgram.keepAlive();
  }, 10 * 1000);

  deepgram.addListener(LiveTranscriptionEvents.Open, async () => {
    console.log("deepgram: connected");

    deepgram.addListener(LiveTranscriptionEvents.Transcript, (data) => {
      console.log("deepgram: transcript received");
      console.log("ws: transcript sent to client");
      ws.send(JSON.stringify(data));
    });

    deepgram.addListener(LiveTranscriptionEvents.Close, async () => {
      console.log("deepgram: disconnected");
      clearInterval(keepAlive);
      deepgram.finish();
    });

    deepgram.addListener(LiveTranscriptionEvents.Error, async (error) => {
      console.log("deepgram: error received");
      console.error(error);
    });

    deepgram.addListener(LiveTranscriptionEvents.Warning, async (warning) => {
      console.log("deepgram: warning received");
      console.warn(warning);
    });

    deepgram.addListener(LiveTranscriptionEvents.Metadata, (data) => {
      console.log("deepgram: metadata received");
      console.log("ws: metadata sent to client");
      ws.send(JSON.stringify({ metadata: data }));
    });
  });

  return deepgram;
};

wss.on("connection", (ws) => {
  console.log("ws: client connected");
  let deepgram = setupDeepgram(ws);

  ws.on("message", (message) => {
    console.log("ws: client data received");

    if (deepgram.getReadyState() === 1 /* OPEN */) {
      console.log("ws: data sent to deepgram");
      deepgram.send(message);
    } else if (deepgram.getReadyState() >= 2 /* 2 = CLOSING, 3 = CLOSED */) {
      console.log("ws: data couldn't be sent to deepgram");
      console.log("ws: retrying connection to deepgram");
      /* Attempt to reopen the Deepgram connection */
      deepgram.finish();
      deepgram.removeAllListeners();
      deepgram = setupDeepgram(ws);
    } else {
      console.log("ws: data couldn't be sent to deepgram");
    }
  });

  ws.on("close", () => {
    console.log("ws: client disconnected");
    deepgram.finish();
    deepgram.removeAllListeners();
    deepgram = null;
  });
});

app.use(express.static("public/"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});

--END--

```



Deepgram sample app (pre-recorded audio):
```
The following text is a Git repository with code. The structure of the text are sections that begin with ----, followed by a single line containing the file path and file name, followed by a variable amount of lines containing the file contents. The text representing the Git repository ends when the symbols --END-- are encounted. Any further text beyond --END-- are meant to be interpreted as instructions using the aforementioned Git repository as context.
----
README.md
# Prerecorded Node.js Starter

[![Discord](https://dcbadge.vercel.app/api/server/xWRaCDBtW4?style=flat)](https://discord.gg/xWRaCDBtW4)

This sample demonstrates interacting with the Deepgram API from Node.js. It uses the Deepgram Node SDK, with a javascript client built from web components.

## What is Deepgram?

[Deepgram](https://deepgram.com/) is a foundational AI company providing speech-to-text and language understanding capabilities to make data readable and actionable by human or machines.

## Sign-up to Deepgram

Before you start, it's essential to generate a Deepgram API key to use in this project. [Sign-up now for Deepgram and create an API key](https://console.deepgram.com/signup?jump=keys).

## Quickstart

### Manual

Follow these steps to get started with this starter application.

#### Clone the repository

Go to GitHub and [clone the repository](https://github.com/deepgram-starters/prerecorded-node-starter).

#### Install dependencies

Install the project dependencies.

```bash
npm install
```

#### Edit the config file

Copy the code from `config.json.example` and create a new file called `config.json`. Paste in the code and enter your API key you generated in the [Deepgram console](https://console.deepgram.com/).

```json
{
  "dgKey": "api_key"
}
```

#### Run the application

Once running, you can [access the application in your browser](http://localhost:8080/).

```bash
npm start
```

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Security Policy](./SECURITY.md) details the procedure for contacting Deepgram.

## Getting Help

We love to hear from you so if you have questions, comments or find a bug in the project, let us know! You can either:

- [Open an issue in this repository](https://github.com/deepgram-starters/prerecorded-node-starter/issues/new)
- [Join the Deepgram Github Discussions Community](https://github.com/orgs/deepgram/discussions)
- [Join the Deepgram Discord Community](https://discord.gg/xWRaCDBtW4)

## Author

[Deepgram](https://deepgram.com)

## License

This project is licensed under the MIT license. See the [LICENSE](./LICENSE) file for more info.

----
config.js
import configJson from "./config.json";

export function getConfig() {
  return {
    domain: configJson.domain,
  };
}

----
config.json.example
{
  "dgKey": "%api_key%"
}

----
deepgram.toml
[meta]
  title = "Prerecorded Node.js Starter"
  description = "Basic demo for using Deepgram to transcribe files with Node.js"
  author = "Deepgram DX Team <devrel@deepgram.com> (https://developers.deepgram.com)"
  useCase = "Prerecorded"
  language = "JavaScript"
  framework = "Node"

[build]
  command = "npm install"

[config]
  sample = "config.json.example"
  output = "config.json"

[post-build]
  message = "Run `npm start` to get up and running."

----
package.json
{
  "name": "@deepgram/prerecorded-node-starter",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@deepgram/sdk": "^1.18.1",
    "cors": "^2.8",
    "express": "^4.18",
    "multer": "^1.4.5-lts.1",
    "npm-run-all": "^4.1"
  },
  "devDependencies": {
    "nodemon": "^2.0"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}

----
server.js
const { Deepgram } = require("@deepgram/sdk");
const config = require("./config.json");
const express = require("express");
const multer = require("multer");
const path = require("path");

const port = process.env.API_PORT || 8080;
const deepgram = new Deepgram(config.dgKey, "api.beta.deepgram.com");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();

app.use(express.static(path.join(__dirname, "static")));

app.post("/api", upload.single("file"), async (req, res) => {
  const { body, file } = req;
  const { url, features, model, version, tier } = body;
  const dgFeatures = JSON.parse(features);

  let dgRequest = null;

  try {
    // validate the URL for a URL request
    if (url) {
      dgRequest = { url };
    }

    // get file buffer for a file request
    if (file) {
      const { mimetype, buffer } = file;
      dgRequest = { buffer, mimetype };
    }

    if (!dgRequest) {
      throw Error(
        "Error: You need to choose a file to transcribe your own audio."
      );
    }

    // send request to deepgram
    const transcription = await deepgram.transcription.preRecorded(dgRequest, {
      ...dgFeatures,
      model,
      tier,
      ...(version ? { version } : null),
      ...(model === "whisper" ? null : { tier }),
    });

    // return results
    res.send({ model, version, tier, dgRequest, dgFeatures, transcription });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err, dgRequest, {
      ...dgFeatures,
      version,
      model,
      tier,
    });

    // handle error
    res.status(500).send({ err: err.message ? err.message : err });
  }
});

app.listen(port, () =>
  console.log(`Starter app running at http://localhost:${port}`)
);

----
static\app.js
import { html, LitElement } from "//cdn.skypack.dev/lit@v2.8.0";

import "./components/app-header.js";
import "./components/app-body.js";

class App extends LitElement {
  render() {
    return html`
      <app-header></app-header>
      <app-body></app-body>
    `;
  }
}

customElements.define("deepgram-starter-ui", App);

----
static\components\app-audio-select.js
import { html, css, LitElement } from "//cdn.skypack.dev/lit@v2.8.0";

class AppAudioSelect extends LitElement {
  static properties = {
    files: {},
    error: {},
    working: {},
    file: {},
    selectedExample: {},
    selectedFile: {},
  };

  static styles = css`
    .app-audio-select {
      width: 80rem;
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-columns: 40% 10% 40%;
      column-gap: 1rem;
      padding-inline-start: 0px;
      justify-items: center;
    }

    ul {
      list-style: none;
    }

    .audio-own {
      width: 80%;
      position: relative;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    .button-choose-file {
      border: none;
      font-size: 16px;
      font-weight: 600;
      border-radius: 0.0625rem;
      background: linear-gradient(95deg, #1796c1 20%, #15bdae 40%, #13ef95 95%);
      height: 45px;
      width: 250px;
      cursor: pointer;
    }

    .selected-file {
      color: rgb(239, 0, 116);
    }

    .audio-own-label {
      font-size: 20px;
      display: flex;
      flex-direction: column;
      padding-bottom: 1.25rem;
    }

    .audio-files-label {
      font-size: 20px;
    }

    .label-text {
      margin: 0;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }
    .or-text {
      height: 100px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 10px;
      font-size: 14px;
      display: inline-block;
      position: relative;
      margin-top: 50px;
    }

    .or-text:before {
      content: "";
      width: 1px;
      height: 50px;
      background: #616165;
      position: absolute;
      bottom: 100%;
      left: 50%;
    }

    .or-text:after {
      content: "";
      width: 1px;
      height: 160px;
      background: #616165;
      position: absolute;
      bottom: -70%;
      left: 50%;
    }

    .audio-file {
      margin-bottom: 10px;
      border-radius: 0.0625rem;
      height: 51px;
      background: #2e3c4d;

      border: solid #3d4f66 1px;
      box-shadow: 0 20px 25px -5px black, 0 8px 10px -6px black;
    }

    .audio-file.active {
      background: #3d4f66;
    }

    .audio-file-label {
      font-size: 14px;
      min-height: 100%;
      display: flex;
      justify-content: center;
      flex-direction: column;
      border-radius: 0.5rem;
      cursor: pointer;
      padding-left: 16px;
      padding-right: 80px;
    }
  `;

  constructor() {
    super();
    this.working = false;
    this.selectedExample = "";
    this.selectedFile = {};
    this.file = {};
    this.files = [
      {
        key: "podcast",
        name: "PODCAST: Deep Learning’s Effect on Science",
        checked: true,
        value:
          "https://res.cloudinary.com/deepgram/video/upload/v1663090404/dg-audio/AI_Show_afpqeh.m4a",
      },
      {
        key: "phone",
        name: "PHONE CALL: First all female NASA Spacewalk",
        checked: false,
        value:
          "https://res.cloudinary.com/deepgram/video/upload/v1663090406/dg-audio/NASA-EXP61_EVA_n5zazi.m4a",
      },
      {
        key: "callcenter",
        name: "CALL CENTER: Upgrade Service",
        checked: false,
        value:
          "https://res.cloudinary.com/deepgram/video/upload/v1663090406/dg-audio/Upgrading-phone-plan_pmfsfm.m4a",
      },
    ];
  }

  get _fileInput() {
    return (this.___fileInput ??=
      this.renderRoot?.querySelector("#file") ?? null);
  }

  get _fileURL() {
    return (this.___fileURL ??=
      this.renderRoot?.querySelector(".audio-example") ?? null);
  }

  get _audioFile() {
    return (this.___audioFile ??=
      this.renderRoot?.querySelectorAll(".audio-file") ?? null);
  }

  handleChange(e) {
    this.selectedFile = {};
    this.selectedExample = e.target.value;
    this._dispatchSelectCdnAudio();
  }

  handleClick() {
    if (this._fileInput) {
      this._fileInput.value = null;
      this.selectedFile = null;
    }

    if (this._fileURL) {
      this._dispatchSelectCdnAudio();
      this._fileInput.value = null;
    }
  }

  showSelected(e) {
    this._audioFile.forEach((node) => {
      if (
        e.target.value &&
        e.target.value == node.childNodes[1].childNodes[1].value
      ) {
        node.className += " active";
      }
    });
    for (let i = 0; i < this._audioFile.length; i++) {
      this._audioFile[i].className = this._audioFile[i].className.replace(
        " active",
        ""
      );
    }
    this._audioFile.forEach((li) => {
      if (li.innerText == e.target.innerText) {
        li.className += " active";
        this.currentCategory = e.target.innerText;
        this.requestUpdate();
      }
    });
  }

  clearSelected() {
    for (let i = 0; i < this._audioFile.length; i++) {
      this._audioFile[i].className = this._audioFile[i].className.replace(
        " active",
        ""
      );
    }
  }

  chooseFile() {
    this._fileInput.click();
    this.clearSelected();
  }

  _dispatchSelectUploadFile() {
    this.selectedFile = this._fileInput.files[0];
    if (this.selectedFile) {
      const options = {
        detail: this.selectedFile,
        bubbles: true,
        composed: true,
      };
      this.dispatchEvent(new CustomEvent("fileselect", options));
    }
  }
  _dispatchSelectCdnAudio() {
    if (this.selectedExample) {
      const options = {
        detail: this.selectedExample,
        bubbles: true,
        composed: true,
      };
      this.dispatchEvent(new CustomEvent("fileURLselect", options));
    }
  }

  render() {
    return html`<ul class="app-audio-select">
      <li class="audio-own">
        <input
          class="sr-only peer"
          type="radio"
          name="audio"
          ?disabled="${this.working}"
        />
        <label class="audio-own-label" htmlFor="file">
          <p class="label-text">Use your own audio</p>
        </label>

        <input
          class="sr-only"
          id="file"
          type="file"
          name="file"
          accept="audio/*,video/*"
          ?disabled="${this.working}"
          @change="${this._dispatchSelectUploadFile}"
        />

        <input
          class="button-choose-file"
          type="button"
          @click="${this.chooseFile}"
          value="Upload Audio File"
        />
        <p style="max-width:450px; ">
          We accept over 40 common audio file formats including MP3, WAV, FLAC,
          M4A, and more.
        </p>
        <div class="selected-file">
          ${this.selectedFile ? this.selectedFile.name : null}
        </div>
      </li>
      <li class="or-text">OR</li>
      <ul>
        <label class="audio-files-label">
          <p class="label-text">Pick a sample file</p>
        </label>

        ${this.files.map(
          (item) =>
            html`<li
              key="${item.key}"
              class="audio-file"
              @click="${this.showSelected}"
            >
              <label class="audio-file-label" htmlFor="${item.key}">
                <input
                  class="sr-only peer audio-example"
                  type="radio"
                  name="audio"
                  value="${item.value}"
                  defaultChecked="${item.checked}"
                  id="${item.key}"
                  ?disabled="${this.working}"
                  @change="${this.handleChange}"
                  @click="${this.handleClick}"
                />
                ${item.name}
              </label>
            </li>`
        )}
      </ul>
    </ul>`;
  }
}

customElements.define("app-audio-select", AppAudioSelect);

----
static\components\app-body.js
import { html, css, LitElement } from "//cdn.skypack.dev/lit@v2.8.0";
import "./app-demo.js";
import "./app-audio-select.js";
import "./app-model-select.js";
import "./app-feature-select.js";

class AppBody extends LitElement {
  static styles = css`
    .body {
      flex-grow: 1;
    }
  `;

  render() {
    return html`<article class="body">
      <app-demo>
        <app-audio-select></app-audio-select>
        <app-model-select></app-model-select>
        <app-feature-select></app-feature-select>
      </app-demo>
    </article>`;
  }
}

customElements.define("app-body", AppBody);

----
static\components\app-button-link.js
import { html, css, LitElement } from "//cdn.skypack.dev/lit@v2.8.0";

class AppButtonLink extends LitElement {
  static properties = {
    url: {},
    size: {},
  };
  static styles = css`
    a {
      color: inherit;
      text-decoration: none;
    }

    :host {
      background: #81f4b4;
      border-radius: 0.375rem;
      display: inline-flex;
      justify-content: center;
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
      padding-left: 0.75rem;
      padding-right: 0.75rem;
    }

    :host(:hover) {
      background: #00a93d;
      color: white;
    }

    :host(.large) {
      padding-left: 0.875rem;
      padding-right: 0.875rem;
      padding-top: 0.625rem;
      padding-bottom: 0.625rem;
    }

    :host(.secondary) {
      background: transparent;
      border: 1px solid #00e062;
      color: inherit;
    }

    .appbutton-link-content {
      color: inherit;
      display: flex;
      align-items: center;
    }
  `;

  render() {
    return html` <a
      href="${this.url}"
      class=${this.size === "large" ? "appbutton-link-large" : "appbutton-link"}
    >
      <div class="appbutton-link-content"><slot /></div>
    </a>`;
  }
}

customElements.define("app-button-link", AppButtonLink);

----
static\components\app-demo.js
import { html, css, LitElement } from "//cdn.skypack.dev/lit@v2.8.0";
import "./app-transcript.js";
import "./app-spinner.js";

class AppDemo extends LitElement {
  static properties = {
    error: {},
    done: {},
    working: {},
    selectedModel: {},
    file: {},
    fileUrl: {},
    selectedFeatures: {},
  };

  static styles = css`
    .app-demo {
      display: flex;
      flex-direction: column;
      margin-left: auto;
      margin-right: auto;
      max-width: 80rem;
      padding: 2rem;
    }

    .demo-instructions {
      font-size: 1.5rem;
      line-height: 2rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .submit-button {
      margin-top: 3rem;
      padding-top: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .submit-button button {
      border: none;
      font-size: 16px;
      font-weight: 600;
      border-radius: 0.0625rem;
      background: linear-gradient(95deg, #1796c1 20%, #15bdae 40%, #13ef95 95%);
      height: 45px;
      width: 250px;
      cursor: pointer;
    }

    .transcript {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  `;

  constructor() {
    super();
    this.selectedModel = "";
    this.file = {};
    this.fileUrl = "";
    this.selectedFeatures = {};
    this.error = "";
    this.done = true;
    this.working = false;
    this.result = {};
  }

  async submitRequest() {
    this.done = false;
    this.working = true;
    this.requestUpdate();
    const apiOrigin = "http://localhost:8080";
    const formData = new FormData();
    if (this.file.size > 0) {
      formData.append("file", this.file);
    }

    if (this.fileUrl) {
      formData.append("url", this.fileUrl);
    }

    formData.append("model", this.selectedModel.model);
    formData.append("tier", this.selectedModel.tier);
    formData.append("features", JSON.stringify(this.selectedFeatures));
    console.log("submit request");

    try {
      const response = await fetch(`${apiOrigin}/api`, {
        method: "POST",
        body: formData,
      });

      const { err, transcription } = await response.json();
      if (err) throw Error(err);
      const { results } = transcription;
      this.result = results;
      this.requestUpdate();
      this.done = true;
      this.working = false;
      setTimeout(() => {
        window.scrollTo({
          top: this._button[0].getBoundingClientRect().top,
          behavior: "smooth",
        });
      }, 500);
    } catch (error) {
      console.log(error);
      // this.error = error;
      this.working = false;
    }
  }

  isLoading() {
    if (this.working) {
      return html` <app-spinner></app-spinner>`;
    } else {
      return null;
    }
  }

  get _button() {
    return (this.___button ??=
      this.renderRoot?.querySelectorAll("button") ?? null);
  }

  _modelSelectListener(e) {
    this.selectedModel = e.detail[0];
  }

  _fileSelectListener(e) {
    this.file = e.detail;
    this.fileUrl = "";
    this.requestUpdate();
  }
  _fileURLSelectListener(e) {
    this.fileUrl = e.detail;
    this.file = {};
    this.requestUpdate();
  }
  _featureSelectListener(e) {
    this.selectedFeatures = e.detail;
    this.requestUpdate();
  }

  render() {
    return html`
      <div
        @fileselect=${this._fileSelectListener}
        @modelselect=${this._modelSelectListener}
        @fileURLselect=${this._fileURLSelectListener}
        @featureselect=${this._featureSelectListener}
        class="app-demo"
      >
        <slot></slot>
      </div>
      <div class="submit-button">
        <button @click="${this.submitRequest}">Transcribe</button>
        <p>${this.error}</p>
      </div>
      <div class="transcript">
        ${this.isLoading()}
        <app-transcript .result="${this.result}"> </app-transcript>
      </div>
    `;
  }
}

customElements.define("app-demo", AppDemo);

----
static\components\app-feature-select.js
import { html, css, LitElement } from "//cdn.skypack.dev/lit@v2.8.0";

class AppFeatureSelect extends LitElement {
  static properties = {
    features: {},
    displayedFeatures: {},
    selectedFeatures: {},
    currentCategory: {},
  };

  static styles = css`
    * {
      box-sizing: border-box;
    }

    .app-feature-select {
      display: flex;
      justify-content: center;
      border-radius: 0.0625rem;
    }

    .tab {
      float: left;
      width: 20%;
      height: 300px;
    }

    .tab button {
      width: 100%;
      color: #a9a9ad;
      text-align: left;
      margin-bottom: 10px;
      border-radius: 0.0625rem;
      height: 51px;
      background: #2e3c4d;
      border: solid #3d4f66 1px;
      border-right: none;
      box-shadow: 0 20px 25px -5px black, 0 8px 10px -6px black;
      font-weight: 900;
      padding: 0 10px;
    }

    .tab button.active {
      color: white;
    }

    .tab button.active div {
      border-bottom: 3px solid #ef0074;
      padding-bottom: 3px;
    }

    .tabcontent {
      background: #2e3c4d;
      float: left;
      padding: 1.25rem;
      border-radius: 0.0625rem;
      border-left: none;
      height: fit-content;
      min-height: 300px;
      width: 50%;
      border: solid #3d4f66 1px;
    }

    .tabcontent input {
      background-color: ;
    }

    .tabcontent label {
      font-weight: 600;
    }

    .tabcontent p {
      color: #ededf2;
    }
  `;

  constructor() {
    super();
    this.displayedFeatures = [];
    this.selectedFeatures = {};
    this.categories = [
      "FORMATTING",
      "REPLACEMENT",
      "IDENTIFICATION",
      "INFERENCE",
    ];
    this.currentCategory = "";
    this.features = [
      {
        category: "FORMATTING",
        name: "Smart Format",
        description:
          "Smart Format improves readability by applying additional FORMATTING. When enabled, the following features will be automatically applied: Punctuation, Numerals, Paragraphs, Dates, Times, and Alphanumerics.",
        key: "smart_format",
        dataType: "boolean",
      },
      {
        category: "FORMATTING",
        name: "Punctuation",
        description:
          "Indicates whether to add punctuation and capitalization to the transcript.",
        key: "punctuate",
        dataType: "boolean",
      },
      {
        category: "FORMATTING",
        name: "Paragraphs",
        description:
          "Indicates whether Deepgram will split audio into paragraphs to improve transcript readability. When paragraphs is set to true, punctuate will also be set to true.",
        key: "paragraphs",
        dataType: "boolean",
      },
      {
        category: "FORMATTING",
        name: "Utterances",
        description:
          "Segments speech into meaningful semantic units. By default, when utterances is enabled, it starts a new utterance after 0.8 s of silence. You can customize the length of time used to determine where to split utterances by submitting the utt_split keyeter.",
        key: "utterances",
        dataType: "boolean",
      },
      {
        category: "REPLACEMENT",
        name: "Numerals",
        description:
          "Indicates whether to convert numbers from written format (e.g. one) to numerical format (e.g. 1).",
        key: "numerals",
        dataType: "boolean",
      },
      {
        category: "REPLACEMENT",
        name: "Profanity Filter",
        description:
          "Indicates whether to remove profanity from the transcript.",
        key: "profanity_filter",
        dataType: "boolean",
      },
      // {
      //   category: "REPLACEMENT",
      //   name: "Redaction",
      //   description:
      //     "Indicates whether to redact sensitive information, replacing redacted content with asterisks (*).",
      //   key: "redact",
      //   dataType: "string",
      // },
      // {
      //   category: "REPLACEMENT",
      //   name: "Find and Replace",
      //   description:
      //     "Terms or phrases to search for in the submitted audio and replace.",
      //   key: "replace",
      //   dataType: "string",
      // },
      // {
      //   category: "IDENTIFICATION",
      //   name: "Search",
      //   description:
      //     "Terms or phrases to search for in the submitted audio. Deepgram searches for acoustic patterns in audio rather than text patterns in transcripts because we have noticed that acoustic pattern matching is more performant.",
      //   key: "search",
      //   dataType: "string",
      // },
      // {
      //   category: "IDENTIFICATION",
      //   name: "Keywords",
      //   description:
      //     "Keywords to which the model should pay particular attention to boosting or suppressing to help it understand context. Intensifier indicates how much you want to boost it. The default Intensifier is one (1). An Intensifier of two (2) equates to two boosts multiplied in a row, whereas zero (0) is equivalent to not specifying a keywords keyeter at all.",
      //   key: "keywords",
      //   dataType: "string",
      // },
      // {
      //   category: "IDENTIFICATION",
      //   name: "Language Detection",
      //   description: "Indicates whether to identify which language is spoken.",
      //   key: "detect_language",
      //   dataType: "boolean",
      // },
      {
        category: "IDENTIFICATION",
        name: "Diarization",
        description: "Indicates whether to recognize speaker changes.",
        key: "diarize",
        dataType: "boolean",
      },
      {
        category: "INFERENCE",
        name: "Summarization",
        description:
          "Indicates whether Deepgram will provide summaries for sections of content. When Summarization is enabled, Punctuation will also be enabled by default.",
        key: "summarize",
        dataType: "boolean",
      },
      {
        category: "INFERENCE",
        name: "Topic Detection",
        description:
          "Indicates whether Deepgram will identify and extract key topics for sections of content.",
        key: "detect_topics",
        dataType: "boolean",
      },
      // {
      //   category: "INFERENCE",
      //   name: "Entity Detection (beta)",
      //   description:
      //     "Indicates whether Deepgram will identify and extract key entities for sections of content.",
      //   key: "detect_entities",
      //   dataType: "boolean",
      // },
    ];
  }

  get _tablinks() {
    return (this.___tablinks ??=
      this.renderRoot?.querySelectorAll(".tablinks") ?? null);
  }

  get _tabcontent() {
    return (this.___tabcontent ??=
      this.renderRoot?.querySelectorAll(".tabcontent") ?? null);
  }

  get _button() {
    return (this.___button ??=
      this.renderRoot?.querySelectorAll("button") ?? null);
  }

  firstUpdated() {
    for (let i = 1; i < this._tabcontent.length; i++) {
      this._tabcontent[i].style.display = "none";
    }
  }

  openSection(e) {
    const tabcontent = this._tabcontent;
    const tablinks = this._tablinks;

    for (let i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
      if (tabcontent[i].id === e.target.innerText) {
        tabcontent[i].style.display = "block";
      }
    }

    for (let i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    this._button.forEach((button) => {
      if (button.innerText == e.target.innerText) {
        button.className += " active";
        this.currentCategory = e.target.innerText;
        this.requestUpdate();
      }
    });
  }

  filterFeatures(item) {
    this.displayedFeatures = [];
    this.features.filter((i) => {
      if (i.category === item) {
        this.displayedFeatures.push(i);
      }
    });
  }

  selectFeature(e) {
    if (this.selectedFeatures.hasOwnProperty(e.target.name)) {
      const featureToDelete = e.target.name;
      delete this.selectedFeatures[featureToDelete];
    } else {
      this.selectedFeatures[e.target.name] = true;
    }

    if (this.selectedFeatures.hasOwnProperty("diarize")) {
      if (!this.selectedFeatures.hasOwnProperty("utterances")) {
        // if diarize is turned on, utterances needs to be turned on for the formatter to work
        this.selectedFeatures["utterances"] = true;
      }
    }

    const options = {
      detail: this.selectedFeatures,
      bubbles: true,
      composed: true,
    };

    this.dispatchEvent(new CustomEvent("featureselect", options));
  }

  render() {
    return html`<div class="app-feature-select">
      <div class="tab">
        <button class="tablinks active" @click="${this.openSection}">
          <div>FORMATTING</div>
        </button>
        <button class="tablinks" @click="${this.openSection}">
          <div>REPLACEMENT</div>
        </button>
        <button class="tablinks" @click="${this.openSection}">
          <div>IDENTIFICATION</div>
        </button>
        <button class="tablinks" @click="${this.openSection}">
          <div>INFERENCE</div>
        </button>
      </div>

      <div id="FORMATTING" class="tabcontent">
        <section @load=${this.filterFeatures("FORMATTING")}>
          ${this.displayedFeatures.map(
            (feature) =>
              html`
                  <input type="checkbox" id="${feature.key}" name="${feature.key}" @change="${this.selectFeature}"><label for="${feature.key}">${feature.name}</label><p>${feature.description}</p></div>`
          )}
        </section>
      </div>

      <div id="REPLACEMENT" class="tabcontent">
        <section @load=${this.filterFeatures("REPLACEMENT")}>
          ${this.displayedFeatures.map(
            (feature) =>
              html`
                  <input type="checkbox" id="${feature.key}" name="${feature.key}" @change="${this.selectFeature}"><label for="${feature.key}">${feature.name}</label><p>${feature.description}</p></div>`
          )}
        </section>
      </div>

      <div id="IDENTIFICATION" class="tabcontent">
        <section @load=${this.filterFeatures("IDENTIFICATION")}>
          ${this.displayedFeatures.map(
            (feature) =>
              html`
                  <input type="checkbox" id="${feature.key}" name="${feature.key}" @change="${this.selectFeature}"><label for="${feature.key}">${feature.name}</label><p>${feature.description}</p></div>`
          )}
        </section>
      </div>

      <div id="INFERENCE" class="tabcontent">
        <section @load=${this.filterFeatures("INFERENCE")}>
          ${this.displayedFeatures.map(
            (feature) =>
              html`
                <input
                  type="checkbox"
                  id="${feature.key}"
                  name="${feature.key}"
                  @change="${this.selectFeature}"
                />
                <label for="${feature.key}">${feature.name}</label>
                <p>${feature.description}</p>
              `
          )}
        </section>
      </div>
    </div>`;
  }
}

customElements.define("app-feature-select", AppFeatureSelect);

----
static\components\app-header.js
import { css, html, LitElement } from "//cdn.skypack.dev/lit@v2.8.0";
import "./app-button-link.js";
class AppHeader extends LitElement {
  static styles = css`
    h1 {
      font-size: inherit;
      font-weight: inherit;
      margin: 0;
    }

    nav {
      background: linear-gradient(
          3.95deg,
          #101014 3.44%,
          rgba(0, 0, 0, 0) 174.43%
        ),
        linear-gradient(
          270deg,
          #208f68 0.7%,
          #27336a 24.96%,
          #0c0310 50.78%,
          #370c4d 76.47%,
          #95125c 100%
        );
      color: white;
    }

    .nav-margin {
      height: 100px;
      max-width: 1536px;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      justify-content: space-between;
      align-items: center;
      align-content: stretch;
      padding-left: 2rem;
      padding-right: 2rem;
    }

    .nav-logo {
      display: inline;
      height: 2rem;
      margin-bottom: -5px;
      margin-right: 1rem;
    }

    .nav-heading {
      display: inline;
    }

    .nav-brand {
      color: white;
      align-items: center;
      display: flex;
      height: 4rem;
    }
  `;

  render() {
    return html`<nav>
      <div class="nav-margin">
        <div class="nav-brand">
          <img src="assets/dg.svg" class="nav-logo" />
          <div>Starter Apps</div>
        </div>

        <app-button-link
          url="https://github.com/deepgram-starters"
          class="secondary"
        >
          <span style="margin-right:10px;">Get the code on Github</span>
        </app-button-link>
      </div>
    </nav>`;
  }
}

customElements.define("app-header", AppHeader);

----
static\components\app-model-select.js
import { html, css, LitElement } from "//cdn.skypack.dev/lit@v2.8.0";

class AppModelSelect extends LitElement {
  static properties = {
    models: {},
    selectedModel: {},
  };
  static styles = css`
    .app-model-select {
      margin-top: 5rem;
      width: 80rem;
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-columns: 35% 20% 10%;
      column-gap: 1rem;
      padding-inline-start: 0px;
    }

    .select-container {
      display: flex;
      flex-direction: column;
      grid-column: 2;
    }

    select {
      padding: 0 16px;
      width: 100%;
      font-size: 14px;
      box-shadow: 0 20px 25px -5px black, 0 8px 10px -6px black;
      color: white;
      height: 51px;
      margin-bottom: 5rem;
      border-radius: 0.0625rem;
      background: #2e3c4d;
      border: solid #3d4f66 1px;
      -moz-appearance: none;
      -webkit-appearance: none;
      appearance: none;
      background-image: url("assets/select.svg");
      background-repeat: no-repeat, repeat;
      background-position: right 0.7em top 50%, 0 0;
      background-size: 14px auto, 150%;
    }

    label {
      margin-bottom: 0.75rem;
    }
  `;

  constructor() {
    super();
    this.selectedModel = "";
    this.models = [
      {
        model: "general",
        name: "Deepgram Nova",
        tier: "nova",
      },
      {
        model: "whisper",
        version: "medium",
        name: "Whisper Cloud",
      },
    ];
  }

  get _select() {
    return (this.___select ??=
      this.renderRoot?.querySelector("select") ?? null);
  }

  firstUpdated() {
    this.renderRoot.querySelector("select").selectedIndex = 0;
    this._dispatchSelectModel();
  }

  _dispatchSelectModel() {
    this.selectedModel = this._select.value;

    const model = this.models.filter((model) => {
      return model.name === this.selectedModel;
    });

    if (this.selectedModel) {
      const options = {
        detail: model,
        bubbles: true,
        composed: true,
      };
      this.dispatchEvent(new CustomEvent("modelselect", options));
    }
  }

  render() {
    return html`<div class="app-model-select">
      <div class="select-container">
        <label>Model:</label>
        <div class="styled-select">
          <select @change=${this._dispatchSelectModel}>
            ${this.models.map(
              (model) =>
                html`<option data-model="${model}">${model.name}</option>`
            )}
          </select>
        </div>
      </div>
    </div>`;
  }
}

customElements.define("app-model-select", AppModelSelect);

----
static\components\app-transcript.js
import { html, css, LitElement } from "//cdn.skypack.dev/lit@v2.8.0";

class AppTranscript extends LitElement {
  static properties = {
    result: {},
    transcript: {},
    summary: {},
    topics: {},
    diarize: {},
  };
  static styles = css`
    section {
      background: #2e3c4d;
      height: fit-content;
      width: 896px;
      margin-bottom: 10px;
      padding: 1.25rem;
      border-radius: 0.0625rem;
      border: solid #3d4f66 1px;
    }

    topics-section {
      display: flex;
      padding-right: 6px;
    }

    .diarize-section {
      padding-bottom: 6px;
    }
  `;
  constructor() {
    super();
    this.transcript = "";
    this.summary = "";
    this.topics = [];
    this.diarize = "";
  }

  update(changedProps) {
    if (changedProps.has("result")) {
      this.setResults();
    }
    super.update(changedProps);
  }

  setResults() {
    if (
      this.result &&
      this.result.channels &&
      this.result.channels[0] &&
      this.result.channels[0].alternatives &&
      this.result.channels[0].alternatives[0] &&
      this.result.channels[0].alternatives[0].transcript
    ) {
      this.transcript = this.result.channels[0].alternatives[0].transcript;
      this.requestUpdate();
    }
    if (
      this.result &&
      this.result.channels &&
      this.result.channels[0] &&
      this.result.channels[0].alternatives &&
      this.result.channels[0].alternatives[0] &&
      this.result.channels[0].alternatives[0].summaries
    ) {
      this.summary =
        this.result.channels[0].alternatives[0].summaries[0].summary;
      this.requestUpdate();
    }
    if (
      this.result &&
      this.result.channels &&
      this.result.channels[0] &&
      this.result.channels[0].alternatives &&
      this.result.channels[0].alternatives[0] &&
      this.result.channels[0].alternatives[0].topics
    ) {
      let topicCategories;
      this.result.channels[0].alternatives[0].topics.forEach((topic) => {
        topicCategories = topic.topics;
        topicCategories.forEach((t) => {
          this.topics.push(t.topic);
        });
      });
    }

    if (this.result && this.result.utterances) {
      this.diarize = formatConversation(this.result.utterances);

      function formatConversation(response) {
        const utterances = response;
        const conversation = [];

        let currentSpeaker = -1;
        let currentUtterance = "";

        for (const utterance of utterances) {
          if (utterance.speaker !== currentSpeaker) {
            if (currentUtterance !== "") {
              conversation.push(currentUtterance);
            }

            currentSpeaker = utterance.speaker;
            currentUtterance = `Speaker ${currentSpeaker}: ${utterance.transcript}`;
          } else {
            currentUtterance += ` ${utterance.transcript}`;
          }
        }

        if (currentUtterance !== "") {
          conversation.push(currentUtterance);
        }

        return conversation;
      }
    }
  }

  displayResults() {
    if (this.transcript.length > 0) {
      return html`
        <section>Transcript: ${this.transcript}</section>
        ${
          this.summary
            ? html` <section>Summary: ${this.summary}</section>`
            : null
        }
        ${
          this.topics.length > 0
            ? html` <section>
              Topics:
              ${
                this.topics &&
                this.topics.map((topic) => html`<div>${topic}</div>`)
              }
            </section>`
            : null
        }
        ${
          this.diarize
            ? html`<section>
              ${
                this.diarize &&
                this.diarize.map((speaker) => {
                  return html`<div class="diarize-section">${speaker}</div>`;
                })
              }
            </section>`
            : null
        }
      `;
    } else {
      return null;
    }
  }

  render() {
    return html`<div>${this.displayResults()}</div>`;
  }
}

customElements.define("app-transcript", AppTranscript);

----
static\index.html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script type="module" src="./app.js"></script>
    <script type="module" src="./components/app-spinner.js"></script>
    <link rel="stylesheet" href="preflight.css" />
    <link
      href="https://fonts.googleapis.com/css?family=Fira+Code"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="style.css" />
  </head>

  <body>
    <deepgram-starter-ui></deepgram-starter-ui>
    <!-- <app-spinner></app-spinner> -->
  </body>
</html>

--END--
```




###### End of Docs ######


repo:
```
The following text is a Git repository with code. The structure of the text are sections that begin with ----, followed by a single line containing the file path and file name, followed by a variable amount of lines containing the file contents. The text representing the Git repository ends when the symbols --END-- are encounted. Any further text beyond --END-- are meant to be interpreted as instructions using the aforementioned Git repository as context.
----
agents-client-api.js
'use strict';
import DID_API from './api.js';

const GROQ_API_KEY = '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';

if (DID_API.key == '🤫') alert('Please put your api key inside ./api.json and restart..');

const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;
let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;
let agentId;
let chatId;

const context = `You are a helpful, harmless, and honest assistant. Please answer the users questions briefly, be concise, usually not more than 1 sentance unless absolutely needed.`;

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');
const agentIdLabel = document.getElementById('agentId-label');
const chatIdLabel = document.getElementById('chatId-label');



// Play the idle video when the page is loaded
window.onload = (event) => {

  playIdleVideo();
}
async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('set remote sdp OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('create local sdp OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('set local sdp OK');




  return sessionClientAnswer;
}
function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}
function onIceCandidate(event) {
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    // WEBRTC API CALL 3 - Submit network information
    fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    });
  }
}
function onIceConnectionStateChange() {
  iceStatusLabel.innerText = peerConnection.iceConnectionState;
  iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
  }
}
function onConnectionStateChange() {
  // not supported in firefox
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
}
function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
}
function onVideoStatusChange(videoIsPlaying, stream) {
  let status;
  if (videoIsPlaying) {
    status = 'streaming';

    const remoteStream = stream;
    setVideoElement(remoteStream);
  } else {
    status = 'empty';
    playIdleVideo();
  }
  streamingStatusLabel.innerText = status;
  streamingStatusLabel.className = 'streamingState-' + status;
}
function onTrack(event) {
  /**
   * The following code is designed to provide information about wether currently there is data
   * that's being streamed - It does so by periodically looking for changes in total stream data size
   *
   * This information in our case is used in order to show idle video while no video is streaming.
   * To create this idle video use the POST https://api.d-id.com/talks (or clips) endpoint with a silent audio file or a text script with only ssml breaks
   * https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#break-tag
   * for seamless results use `config.fluent: true` and provide the same configuration as the streaming video
   */

  if (!event.track) return;

  statsIntervalId = setInterval(async () => {
    const stats = await peerConnection.getStats(event.track);
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {

        const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;

        if (videoStatusChanged) {
          videoIsPlaying = report.bytesReceived > lastBytesReceived;
          onVideoStatusChange(videoIsPlaying, event.streams[0]);
        }
        lastBytesReceived = report.bytesReceived;
      }
    });
  }, 300);
}

function setVideoElement(stream) {
  if (!stream) return;
  // Add Animation Class
  videoElement.classList.add("animated")

  // Removing browsers' autoplay's 'Mute' Requirement
  videoElement.muted = false;

  videoElement.srcObject = stream;
  videoElement.loop = false;

  // Remove Animation Class after it's completed
  setTimeout(() => {
    videoElement.classList.remove("animated")
  }, 300);

  // safari hotfix
  if (videoElement.paused) {
    videoElement
      .play()
      .then((_) => { })
      .catch((e) => { });
  }
}
function playIdleVideo() {
  // Add Animation Class
  videoElement.classList.toggle("animated")

  videoElement.srcObject = undefined;
  videoElement.src = 'emma_idle.mp4';
  videoElement.loop = true;

  // Remove Animation Class after it's completed
  setTimeout(() => {
    videoElement.classList.remove("animated")
  }, 300);
}
function stopAllStreams() {
  if (videoElement.srcObject) {
    console.log('stopping video streams');
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
}
function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('stopping peer connection');
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  iceGatheringStatusLabel.innerText = '';
  signalingStatusLabel.innerText = '';
  iceStatusLabel.innerText = '';
  peerStatusLabel.innerText = '';
  console.log('stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}
const maxRetryCount = 2;
const maxDelaySec = 2;
async function fetchWithRetries(url, options, retries = 1) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 500;

      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}

const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {


  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }
  stopAllStreams();
  closePC();

  // WEBRTC API CALL 1 - Create a new stream
  const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg'
    }),
  });


  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
  streamId = newStreamId;
  sessionId = newSessionId;
  try {
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (e) {
    console.log('error during streaming setup', e);
    stopAllStreams();
    closePC();
    return;
  }

  // WEBRTC API CALL 2 - Start a stream
  const sdpResponse = await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer: sessionClientAnswer,
      session_id: sessionId,
    }),
  });
};


document.addEventListener("DOMContentLoaded", () => {

  const speakButton = document.getElementById('speak-button');
  speakButton.onclick = async () => {
    if (speakButton.innerText === "Speak") {
      // Start recording
      await startRecording();
      speakButton.innerText = "Stop";
    } else {
      // Stop recording
      await stopRecording();
      speakButton.innerText = "Speak";
    }
  };

  async function startRecording() {
    const deepgramApiKey = "ab184815a3899aea7e3add69b9d5b7bc6894dc74";
    const deepgramLive = new deepgram.LiveTranscription(deepgramApiKey, {
      language: "en",
      punctuate: true,
      smart_format: true,
      model: "nova",
      channels: 1,
      sample_rate: 16000,
      endpointing: true
    });
  
    deepgramLive.addListener(deepgram.LiveTranscriptionEvent.Open, async () => {
      console.log("Deepgram connection opened");
    });
  
    deepgramLive.addListener(deepgram.LiveTranscriptionEvent.Error, (error) => {
      console.error("Deepgram error:", error);
    });
  
    // Add the Transcript event listener here
    deepgramLive.addListener(deepgram.LiveTranscriptionEvent.Transcript, (data) => {
      console.log("Transcript received:", data);
      const transcript = data.channel.alternatives[0].transcript;
      sendTranscriptToChat(transcript);
    });
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
  
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          deepgramLive.send(event.data);
        }
      });
  
      mediaRecorder.start(750);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }

  async function stopRecording() {
    deepgramLive.stop();
  }

  async function sendTranscriptToChat(transcript) {
    // Pasting the user's message to the Chat History element
    document.getElementById("msgHistory").innerHTML += `<span style='opacity:0.5'><u>User:</u> ${transcript}</span><br>`;

    // Agents Overview - Step 3: Send a Message to a Chat session - Send a message to a Chat
    const playResponse = await fetchWithRetries(`${DID_API.url}/agents/${agentId}/chat/${chatId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "streamId": streamId,
        "sessionId": sessionId,
        "messages": [
          {
            "role": "user",
            "content": transcript,
            "created_at": new Date().toString()
          }
        ]
      }),
    });
  }

});




async function startStreaming(assistantReply) {
  const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      script: {
        type: 'text',
        input: assistantReply,
      },
      config: {
        fluent: true,
        pad_audio: 0,
      },
      session_id: sessionId,
    }),
  });
}



const startButton = document.getElementById('start-button');
startButton.onclick = async () => {
  if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
    // Pasting the user's message to the Chat History element
    document.getElementById("msgHistory").innerHTML += `<span style='opacity:0.5'><u>User:</u> ${textArea.value}</span><br>`;

    // Add user message to chat history
    chatHistory.push({
      role: 'user',
      content: textArea.value
    });

    // Clearing the text-box element
    document.getElementById("textArea").value = "";

    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: context,
            },
            ...chatHistory,
          ],
          model: 'mixtral-8x7b-32768',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      let assistantReply = '';
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.substring(5).trim();
              if (data === '[DONE]') {
                done = true;
                break;
              }

              const parsed = JSON.parse(data);
              assistantReply += parsed.choices[0]?.delta?.content || '';
            }
          }
        }
      }

      // Add assistant reply to chat history
      chatHistory.push({
        role: 'assistant',
        content: assistantReply,
      });

      // Append the complete assistant reply to the chat history element
      document.getElementById('msgHistory').innerHTML += `<span><u>Assistant:</u> ${assistantReply}</span><br>`;

      // Initiate streaming
      await startStreaming(assistantReply);
    } catch (error) {
      console.error('Error:', error);
      // Handle the error, display an error message, etc.
    }
  }
};


const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  stopAllStreams();
  closePC();
};

----
api.js
export default {
    key: "YWRtaW4xQHNrb29wLmRpZ2l0YWw:quCILV7kl0vt4FJEvJLvf",
    url: "https://api.d-id.com",
    service: "talks",
    groqKey: "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"
};
----
app.js
const express = require('express');
const http = require('http');
const cors = require('cors');

const port = 3000;

const app = express();
app.use(cors());

app.use('/', express.static(__dirname, {
    setHeaders: (res, path) => {
      if (path.endsWith('.json')) {
        res.type('application/javascript');
      }
    }
  }));

app.use('/', express.static(__dirname));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
});
app.get('/agents', function(req, res) {
    res.sendFile(__dirname + '/index-agents.html')
});

const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port localhost:${port}`));


----
groqServer.js
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const port = 3001;

const GROQ_API_KEY = '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';
const groq = new Groq({ apiKey: GROQ_API_KEY });

app.use(cors());
app.use(express.json());;

app.post('/chat', async (req, res) => {
  const { messages, model } = req.body;

  try {
    const completion = await groq.chat.completions.create({
      messages,
      model,
      stream: true,
    });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    for await (const chunk of completion) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
----
index-agents.html
<!DOCTYPE html>
<html>
<head>
  <title>D-ID Agents API Demo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style-agents.css">
  <link rel="icon" type="image/png" sizes="192x192" href="https://studio.d-id.com/favicon/favicon-192x192.png">
</head>

<body>
  <div id="content">
    <div id="status">
      <h4>WebRTC Connection Status</h4>
      ICE gathering status: <label id="ice-gathering-status-label"></label><br />
      ICE status: <label id="ice-status-label"></label><br />
      Peer connection status: <label id="peer-status-label"></label><br />
      Signaling status: <label id="signaling-status-label"></label><br />
      Streaming status: <label id="streaming-status-label"></label><br />
      <br>
      <div id="buttons">
        <button id="connect-button" type="button">Connect</button>
        <button id="destroy-button" type="button">Destroy</button>
      </div>
    </div>

    <div id="video-wrapper">
      <div>
        <video id="video-element" width="400" height="400" src="" autoplay loop muted class="animated"></video>
      </div>
    </div>

    <div class="chat">
      <h4>Chat History</h4>
      <div id="msgHistory">
      </div>
    </div>
  </div>

  <div>
    <h3>Speak your message:</h3>
    <button id="speak-button" type="button">Speak</button>
  </div>

  <script type="module" src="./agents-client-api.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@deepgram/sdk"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/groq-sdk@0.3.2/index.mjs?mime=application/javascript" type="module"></script>
</body>
</html>
----
index.html
<!DOCTYPE html>
<html>
  <head>
    <title>D-ID Streaming POC</title>
    <!-- added google fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;700&display=swap"
      rel="stylesheet"
    />

    <style>
      .peerConnectionState-new {
        color: cornflowerblue;
      }
      .peerConnectionState-connecting {
        color: orange;
      }
      .peerConnectionState-connected {
        color: green;
      }
      .peerConnectionState-disconnected,
      .peerConnectionState-closed,
      .peerConnectionState-failed {
        color: red;
      }

      .iceConnectionState-new {
        color: cornflowerblue;
      }
      .iceConnectionState-checking {
        color: orange;
      }
      .iceConnectionState-connected,
      .iceConnectionState-completed {
        color: green;
      }
      .peerConnectionState-disconnected,
      .peerConnectionState-closed,
      .peerConnectionState-failed {
        color: red;
      }

      .iceGatheringState-new {
        color: cornflowerblue;
      }
      .iceGatheringState-gathering {
        color: orange;
      }
      .iceGatheringState-complete {
        color: black;
      }

      .signalingState-stable {
        color: green;
      }
      .signalingState-have-local-offer,
      .signalingState-have-remote-offer,
      .signalingState-have-local-pranswer,
      .signalingState-have-remote-pranswer {
        color: cornflowerblue;
      }
      .signalingState-closed {
        color: red;
      }

      .streamingState-streaming {
        color: green;
      }

      .streamingState-empty {
        color: grey;
      }

      /* added css from here */

      body * {
        font-family: 'Mulish', sans-serif;
        text-align: center;
      }

      #content {
        width: 820px;
        position: relative;
        margin: 0 auto;
      }

      #buttons {
        clear: both;
        padding: 0 0 0 0;
        text-align: center;
      }

      button {
        padding: 10px 20px;
        border-radius: 5px;
        border: none;
        font-size: 16px;
        margin: 0 5px;
        background-color: #7459fe;
        color: #fff;
      }

      button:hover {
        background-color: #9480ff;
        cursor: pointer;
        transition: all 0.2s ease-out;
      }

      #status {
        clear: both;
        padding: 20px 0 0 0;
        text-align: left;
        display: inline-block;
        zoom: 1;
        line-height: 140%;
        font-size: 15px;
      }

      #status div {
        padding-bottom: 10px;
      }

      #video-wrapper {
        background: url(bg.png);
        height: 500px;
        background-position: top;
      }

      #video-wrapper div {
        width: 400px;
        margin: 0 auto;
        padding: 50px 0 0 0;
      }
      video {
        display: block;
        /*border:1px solid;*/
        border-radius: 50%;
        background-color: #fff;
      }
    </style>
  </head>

  <body>
    <!-- adde "id=content" -->
    <div id="content">
      <!-- added "id=video-wrapper" -->
      <div id="video-wrapper">
        <div>
          <video id="video-element" width="400" height="400" autoplay></video>
        </div>
      </div>
      <br />

      <!-- added div#buttons -->
      <div id="buttons">
        <button id="connect-button" type="button">Connect</button>
        <button id="start-button" type="button">Start</button>
        <button id="destroy-button" type="button">Destroy</button>
      </div>

      <!-- added div#status -->
      <div id="status">
        <!-- removed the wrapping <div> tags -->
        ICE gathering status: <label id="ice-gathering-status-label"></label
        ><br />
        ICE status: <label id="ice-status-label"></label><br />
        Peer connection status: <label id="peer-status-label"></label><br />
        Signaling status: <label id="signaling-status-label"></label><br />
        Streaming status: <label id="streaming-status-label"></label><br />
      </div>
    </div>

    <script type="module" src="./index.js"></script>
  </body>
</html>

----
index.js
import './streaming-client-api.js';

----
package.json
{
  "dependencies": {
    "@deepgram/sdk": "^3.2.0",
    "axios": "^1.4.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "groq-sdk": "^0.3.2"
  },
  "scripts": {
    "dev": "node app.js"
  }
}
----
streaming-client-api.js
'use strict';
import DID_API from './api';

const GROQ_API_KEY = DID_API.groqKey;

if (DID_API.key == '🤫') alert('Please put your api key inside ./api.json and restart..');

const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;

let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');

const presenterInputByService = {
  talks: {
    source_url: 'https://d-id-public-bucket.s3.amazonaws.com/or-roman.jpg',
  },
  clips: {
    presenter_id: 'rian-lZC6MmWfC1',
    driver_id: 'mXra4jY38i'
  }
}

const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {
  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }

  stopAllStreams();
  closePC();

  const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(presenterInputByService[DID_API.service]),
  });

  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
  streamId = newStreamId;
  sessionId = newSessionId;

  try {
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (e) {
    console.log('error during streaming setup', e);
    stopAllStreams();
    closePC();
    return;
  }

  const sdpResponse = await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer: sessionClientAnswer,
      session_id: sessionId,
    }),
  });
};

const startButton = document.getElementById('start-button');
startButton.onclick = async () => {
  // connectionState not supported in firefox
  if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
    const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: {
          type: 'audio',
          audio_url: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/webrtc.mp3',
        },
        ...(DID_API.service === 'clips' && {
          background: {
            color: '#FFFFFF'
          }
        }),
        config: {
          stitch: true,
        },
        session_id: sessionId,
      }),
    });
  }
};

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  stopAllStreams();
  closePC();
};

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}
function onIceCandidate(event) {
  console.log('onIceCandidate', event);
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    });
  }
}
function onIceConnectionStateChange() {
  iceStatusLabel.innerText = peerConnection.iceConnectionState;
  iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
  }
}
function onConnectionStateChange() {
  // not supported in firefox
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
}
function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
}

function onVideoStatusChange(videoIsPlaying, stream) {
  let status;
  if (videoIsPlaying) {
    status = 'streaming';
    const remoteStream = stream;
    setVideoElement(remoteStream);
  } else {
    status = 'empty';
    playIdleVideo();
  }
  streamingStatusLabel.innerText = status;
  streamingStatusLabel.className = 'streamingState-' + status;
}

function onTrack(event) {
  /**
   * The following code is designed to provide information about wether currently there is data
   * that's being streamed - It does so by periodically looking for changes in total stream data size
   *
   * This information in our case is used in order to show idle video while no video is streaming.
   * To create this idle video use the POST https://api.d-id.com/talks (or clips) endpoint with a silent audio file or a text script with only ssml breaks
   * https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#break-tag
   * for seamless results use `config.fluent: true` and provide the same configuration as the streaming video
   */

  if (!event.track) return;

  statsIntervalId = setInterval(async () => {
    const stats = await peerConnection.getStats(event.track);
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;

        if (videoStatusChanged) {
          videoIsPlaying = report.bytesReceived > lastBytesReceived;
          onVideoStatusChange(videoIsPlaying, event.streams[0]);
        }
        lastBytesReceived = report.bytesReceived;
      }
    });
  }, 300);
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('set remote sdp OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('create local sdp OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('set local sdp OK');

  return sessionClientAnswer;
}

function setVideoElement(stream) {
  if (!stream) return;
  videoElement.srcObject = stream;
  videoElement.loop = false;

  // safari hotfix
  if (videoElement.paused) {
    videoElement
      .play()
      .then((_) => {})
      .catch((e) => {});
  }
}

function playIdleVideo() {
  videoElement.srcObject = undefined;
  videoElement.src = DID_API.service == 'clips' ? 'rian_idle.mp4' : 'or_idle.mp4';
  videoElement.loop = true;
}

function stopAllStreams() {
  if (videoElement.srcObject) {
    console.log('stopping video streams');
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('stopping peer connection');
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  iceGatheringStatusLabel.innerText = '';
  signalingStatusLabel.innerText = '';
  iceStatusLabel.innerText = '';
  peerStatusLabel.innerText = '';
  console.log('stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

const maxRetryCount = 3;
const maxDelaySec = 4;

async function fetchWithRetries(url, options, retries = 1) {
  try {
    const res = await fetch(url, options);
    if(res.status >= 200 && res.status <= 299) {
      return res;
    } else {
      throw new Error(`Response status ${res.status}`);
    }
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 500;

      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}

----
style-agents.css
.peerConnectionState-new {
  color: cornflowerblue;
}
.peerConnectionState-connecting {
  color: orange;
}
.peerConnectionState-connected {
  color: green;
}
.peerConnectionState-disconnected,
.peerConnectionState-closed,
.peerConnectionState-failed {
  color: red;
}

.iceConnectionState-new {
  color: cornflowerblue;
}
.iceConnectionState-checking {
  color: orange;
}
.iceConnectionState-connected,
.iceConnectionState-completed {
  color: green;
}
.peerConnectionState-disconnected,
.peerConnectionState-closed,
.peerConnectionState-failed {
  color: red;
}

.iceGatheringState-new {
  color: cornflowerblue;
}
.iceGatheringState-gathering {
  color: orange;
}
.iceGatheringState-complete {
  color: black;
}

.signalingState-stable {
  color: green;
}
.signalingState-have-local-offer,
.signalingState-have-remote-offer,
.signalingState-have-local-pranswer,
.signalingState-have-remote-pranswer {
  color: cornflowerblue;
}
.signalingState-closed {
  color: red;
}

.streamingState-streaming {
  color: green;
}

.streamingState-empty {
  color: grey;
}

#agentId-label, #chatId-label{
  color: green;
}

/* added css from here */

body * {
  font-family: 'Mulish', sans-serif;
  text-align: center;
}

#content {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  margin-top: 50px;
}

#buttons {
  clear: both;
  padding: 0 0 0 0;
  text-align: center;
}

button {
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  font-size: 16px;
  margin: 0 5px;
  background-color: #7459fe;
  color: #fff;
}

button#connect-button {
background-color: green;
}
button#destroy-button{
  background-color: red;
}

button#start-button{
  margin: 1em;
}

button:hover, #destroy-button:hover,#connect-button:hover {
  filter: brightness(85%);
  cursor: pointer;
  transition: all 0.2s ease-out;
}

h4{
  margin: 0;
  margin-bottom: 10px;
}

textarea {
  font-size: 16px;
  text-align: center;
  width: 500px;
  border-radius: 5px;
  padding: 10px 20px;
  border: 2px solid #7459fe;
  font-size: 16px;
  margin: 0 5px;
}

#msgHistory {
  overflow-y: auto;
  line-break: loose;
}

#status {
  display: inline-block;
  zoom: 1;
  line-height: 140%;
  font-size: 15px;
  width: 400px;
}

#status div {
  padding-bottom: 10px;
}

#video-wrapper {
  /* height: 500px; */
  width: 400px;
  height: 400px;
  background-position: top;
}

.chat{
  width: 400px;
}


video {
  /* display: block; */
  border-radius: 50%;
  background-image: url("emma_idle.png");
  background-position: top;
  /* position: absolute; */
  background-size: contain;
}

.animated {
  animation: opacityAnimation 0.2s ease-in-out;
}

@keyframes opacityAnimation {
from { opacity: 0.8; }
to { opacity: 1; }
}

--END--
```

Question:

I have modified this repo to use groq instead of openai. Specifically when you visit /index-agents.html.
I used mixtral-8x7b-32768

Now modify the app so the we change the text input to be an microphone input.
The button "Send" should be changed to "Speak" and once clicked the button should change to "Stop" and the user should be able to speak into the microphone. Once the user clicks "Stop" the text should be sent to the chat as if it was typed in the text input.

We want to process the audio using the deepgram API so we can get back the text.

Modify the file or repo accordingly.

when returning the files, write out the full files which need to be changed, only leaving out the content of a function if it has not changed, however you still NEED to write out the function definition. All else should be included and in the correct order.

We want to make it as fast as possible. 

the repo provided above is an attempt at these latest changes, however we are getting some issues:

agents-client-api.js:404 
 Uncaught TypeError: Cannot set properties of null (setting 'onclick')
    at agents-client-api.js:404:21
(anonymous)	@	agents-client-api.js:404

agents-client-api.js:303 
 Uncaught (in promise) TypeError: deepgram.LiveTranscription is not a constructor
    at startRecording (agents-client-api.js:303:26)
    at speakButton.onclick (agents-client-api.js:292:13)
startRecording	@	agents-client-api.js:303
speakButton.onclick	@	agents-client-api.js:292
﻿


the connect button works and the head moves in idel mode, but only a console error happens when i press speak, and other than that it doesnt do anything.


import { Deepgram, LiveTranscriptionEvents, createClient } from '@deepgram/sdk';
whenver i add this line it fails to start.

Do i need to modify the app to accomadate the streaming from deepgram.