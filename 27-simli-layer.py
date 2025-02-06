#
# Copyright (c) 2024–2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

import asyncio
import os
import sys

import aiohttp
from dotenv import load_dotenv
from loguru import logger
from runner import configure
from simli import SimliConfig

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.elevenlabs import ElevenLabsTTSService
from pipecat.services.openai import OpenAILLMService
from pipecat.services.simli import SimliVideoService
from pipecat.transports.services.daily import DailyParams, DailyTransport

load_dotenv(override=True)

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")


async def main():
    async with aiohttp.ClientSession() as session:
        room, token = await configure(session)
        transport = DailyTransport(
        room_url,
        token,
        "Chatbot",
        DailyParams(
            audio_out_enabled=True,
            camera_out_enabled=True,
            camera_out_width=512,
            camera_out_height=512,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            transcription_enabled=True,
            transcription_settings=DailyTranscriptionSettings(language="no"),
        ),
        )

        tts = ElevenLabsTTSService(
            api_key=os.getenv("ELEVENLABS_API_KEY", ""),
            voice_id=os.getenv("ELEVENLABS_VOICE_ID", "2dhHLsmg0MVma2t041qT"),
            model_id="eleven_multilingual_v2"
)

        simli_ai = SimliVideoService(
            SimliConfig(os.getenv("SIMLI_API_KEY"), os.getenv("SIMLI_FACE_ID"))
        )

        llm = OpenAILLMService(api_key=os.getenv("OPENAI_API_KEY"), model="gpt-4o-mini") # try to see if there is a way to this use llama

        messages = [
            {
                "role": "system",
                "content": """
                Du er en norsk AI-assistent. VIKTIG:
                1. Du MÅ ALLTID svare på norsk, uansett hvilket språk brukeren bruker
                2. Hvis noen snakker engelsk eller andre språk, svar høflig på norsk: 'Beklager, jeg snakker bare norsk. Kan du prøve å snakke norsk?'
                3. Hold svarene korte og presise
                4. Unngå spesialtegn siden svarene blir konvertert til tale
                5. Vær vennlig og hjelpsom, men alltid på norsk
                6. Aldri bytt til andre språk, uansett hva
                """,
            },
        ]

        context = OpenAILLMContext(messages)
        context_aggregator = llm.create_context_aggregator(context)

        pipeline = Pipeline(
            [
                transport.input(),
                context_aggregator.user(),
                llm,
                tts,
                simli_ai,
                transport.output(),
                context_aggregator.assistant(),
            ]
        )

        task = PipelineTask(
            pipeline,
            PipelineParams(
                allow_interruptions=True,
                enable_metrics=True,
            ),
        )

        @transport.event_handler("on_first_participant_joined")
        async def on_first_participant_joined(transport, participant):
            await transport.capture_participant_transcription(participant["id"])
            await task.queue_frames([context_aggregator.user().get_context_frame()])

        runner = PipelineRunner()
        await runner.run(task)


if __name__ == "__main__":
    asyncio.run(main())