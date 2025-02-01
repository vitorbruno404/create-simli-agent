import React, { useRef, useState } from "react";
import { DailyProvider } from "@daily-co/daily-react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import VideoBox from "@/app/Components/VideoBox";
import cn from "./utils/TailwindMergeAndClsx";
import IconSparkleLoader from "@/media/IconSparkleLoader";

interface SimliAgentProps {
  onStart: () => void;
  onClose: () => void;
}

// Get your Simli API key from https://app.simli.com/
const SIMLI_API_KEY = process.env.NEXT_PUBLIC_SIMLI_API_KEY;

const SimliAgent: React.FC<SimliAgentProps> = ({ onStart, onClose }) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarVisible, setIsAvatarVisible] = useState(false);

  const [tempRoomUrl, setTempRoomUrl] = useState<string>("");
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const myCallObjRef = useRef<DailyCall | null>(null);
  const [chatbotId, setChatbotId] = useState<string | null>(null);

  const [lessonPlan, setLessonPlan] = useState('');
  const [topics, setTopics] = useState(['Basic Greetings', 'Numbers 1-10', 'Common Phrases', 'Simple Questions']);
  const [vocabulary, setVocabulary] = useState([
    { norwegian: 'Hei', english: 'Hello' },
    { norwegian: 'Takk', english: 'Thank you' },
    { norwegian: 'God dag', english: 'Good day' },
    { norwegian: 'Ha det bra', english: 'Goodbye' }
  ]);

  /**
   * Create a new Simli room and join it using Daily
   */
  const handleJoinRoom = async () => {
    setIsLoading(true);

    const response = await fetch("https://api.simli.ai/startE2ESession", {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({
          apiKey: SIMLI_API_KEY,
          faceId: "7bd8ef12-22ea-41e6-be06-e0c2f9fe2e24",
          voiceId: "sonic-norwegian",
          firstMessage: "Hei alle sammen, jeg heter Ola Norman, jeg er her for å hjelpe dere med å lære norsk.",
          systemPrompt: "Du er en vennlig og tålmodig norsk språklærer med en varm og oppmuntrende tone. Din målgruppe er nybegynnere som ønsker å lære konversasjonsnorsk for daglig bruk. Du forklarer ting enkelt, gir eksempler, og bruker korte, praktiske setninger.. . Personlighet og undervisningsstil. Du er oppmuntrende og tålmodig, og gir ros når brukeren gjør fremskritt.. Du bruker en naturlig og enkel skrivestil, uten kompliserte forklaringer.. Du gir realistiske samtaleeksempler som hjelper eleven med å kommunisere i hverdagen.. Når brukeren gjør feil, retter du dem vennlig og forklarer hvorfor.. Du motiverer brukeren til å snakke og skrive selv, og gir små utfordringer for å øve.. Eksempel på svar. Bruker: Hvordan sier jeg 'Where is the train station?' på norsk?. AI: Du kan si: 'Hvor er togstasjonen?'. Hvis du vil være mer høflig, kan du si: 'Unnskyld, hvor er togstasjonen?'. . Bruker: Hvordan bestiller jeg mat på en kafé?. AI: Hvis du vil bestille kaffe, kan du si:. 'Jeg vil gjerne ha en kaffe, takk.'. Vil du øve en liten dialog sammen?",
      }),
    })

    const data = await response.json();
    const roomUrl = data.roomUrl;

    // Print the API response 
    console.log("API Response", data);

    // Create a new Daily call object
    let newCallObject = DailyIframe.getCallInstance();
    if (newCallObject === undefined) {
      newCallObject = DailyIframe.createCallObject({
        videoSource: false,
      });
    }

    // Setting my default username
    newCallObject.setUserName("User");

    // Join the Daily room
    await newCallObject.join({ url: roomUrl });
    myCallObjRef.current = newCallObject;
    console.log("Joined the room with callObject", newCallObject);
    setCallObject(newCallObject);

    // Start checking if Simli's Chatbot Avatar is available
    loadChatbot();
  };  

  /**
   * Checking if Simli's Chatbot avatar is available then render it
   */
  const loadChatbot = async () => {
    if (myCallObjRef.current) {
      let chatbotFound: boolean = false;

      const participants = myCallObjRef.current.participants();
      for (const [key, participant] of Object.entries(participants)) {
        if (participant.user_name === "Chatbot") {
          setChatbotId(participant.session_id);
          chatbotFound = true;
          setIsLoading(false);
          setIsAvatarVisible(true);
          onStart();
          break; // Stop iteration if you found the Chatbot
        }
      }
      if (!chatbotFound) {
        setTimeout(loadChatbot, 500);
      }
    } else {
      setTimeout(loadChatbot, 500);
    }
  };  

  /**
   * Leave the room
   */
  const handleLeaveRoom = async () => {
    if (callObject) {
      await callObject.leave();
      setCallObject(null);
      onClose();
      setIsAvatarVisible(false);
      setIsLoading(false);
    } else {
      console.log("CallObject is null");
    }
  };

  /**
   * Mute participant audio
   */
  const handleMute = async () => {
    if (callObject) {
      callObject.setLocalAudio(false);
    } else {
      console.log("CallObject is null");
    }
  };

  const handleLessonPlanChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLessonPlan(e.target.value);
    // Here you could add logic to parse the text and update topics and vocabulary
  };

  return (
    <>
      <div className="flex flex-row gap-8 items-start">
        <div>
          {isAvatarVisible && (
            <div className="h-[350px] w-[350px]">
              <div className="h-[350px] w-[350px]">
                <DailyProvider callObject={callObject}>
                  {chatbotId && <VideoBox key={chatbotId} id={chatbotId} />}
                </DailyProvider>
              </div>
            </div>
          )}
        </div>

        {/* Updated content section */}
        <div className="w-[400px] min-h-[350px] p-6 bg-gray-900 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-white">Norwegian Lessons</h2>
          <div className="space-y-4">
            {/* Add text input area */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-medium text-white mb-2">Lesson Plan:</h3>
              <textarea
                value={lessonPlan}
                onChange={handleLessonPlanChange}
                placeholder="Paste your lesson plan here..."
                className="w-full h-32 p-2 bg-gray-700 text-white rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Topics section */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-medium text-white mb-2">Today's Topics:</h3>
              <ul className="list-disc list-inside text-gray-300">
                {topics.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </div>

            {/* Vocabulary section */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-medium text-white mb-2">Vocabulary:</h3>
              <div className="grid grid-cols-2 gap-2 text-gray-300">
                {vocabulary.map((word, index) => (
                  <div key={index}>{word.norwegian} - {word.english}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center mt-4">
        {!isAvatarVisible ? (
          <button
            onClick={handleJoinRoom}
            disabled={isLoading}
            className={cn(
              "w-full h-[52px] mt-4 disabled:bg-[#343434] disabled:text-white disabled:hover:rounded-[100px] bg-simliblue text-white py-3 px-6 rounded-[100px] transition-all duration-300 hover:text-black hover:bg-white hover:rounded-sm",
              "flex justify-center items-center"
            )}
          >
            {isLoading ? (
              <IconSparkleLoader className="h-[20px] animate-loader" />
            ) : (
              <span className="font-abc-repro-mono font-bold w-[164px]">
                Test Interaction
              </span>
            )}
          </button>
        ) : (
          <>
            <div className="flex items-center gap-4 w-full">
              <button
                onClick={handleLeaveRoom}
                className={cn(
                  "mt-4 group text-white flex-grow bg-red hover:rounded-sm hover:bg-white h-[52px] px-6 rounded-[100px] transition-all duration-300"
                )}
              >
                <span className="font-abc-repro-mono group-hover:text-black font-bold w-[164px] transition-all duration-300">
                  Stop Interaction
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SimliAgent;