import {
  Heading,
  Text,
  Image,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import { getStartedResouceConfig } from "../pages-config";
import addDataImage from "../images/add_data.png";
import microbitXYXImage from "../images/microbit_xyz_arrows.png";
import testModelImage from "../images/test_model.png";
import trainModelImage from "../images/train_model.png";
import ResourcePageLayout from "../components/ResourcePageLayout";

const GetStartedResourcePage = () => {
  const { id, videoId, videoTitleId } = getStartedResouceConfig;
  return (
    <ResourcePageLayout id={id} videoId={videoId} videoTitleId={videoTitleId}>
      <Heading as="h2">Get connected</Heading>
      <Text>
        To start using the micro:bit AI creator, you need to connect a micro:bit
        to the <strong>micro:bit AI creator</strong> web page on your computer.
      </Text>
      <Text>There are two options for connecting the micro:bit.</Text>
      <Heading as="h3">Option 1: Web Bluetooth</Heading>
      <Text>The first option uses a Web Bluetooth wireless connection.</Text>
      <Text>
        Click on 'Start new session' and follow the instructions on screen.
      </Text>
      <Heading as="h3">Option 2: micro:bit radio</Heading>
      <Text>
        If you can't use Bluetooth on your computer, the second option uses a
        micro:bit radio connection instead.
      </Text>
      <Text>
        Click on 'Start new session', then 'Connect using micro:bit radio
        instead' and follow the instructions on screen.
      </Text>
      <Text>
        The micro:bit radio option uses two micro:bits. The first micro:bit
        senses movement. It sends movement data using radio to a second
        micro:bit connected to your computer with a USB cable.
      </Text>
      <h2>Now you're connected</h2>
      <Text>
        Once the micro:bit sensing movement is connected, you'll see a happy
        face on its LED display.
      </Text>
      <Text>
        As you move the micro:bit, you see live movement data from its
        accelerometer sensor in a graph at the bottom of the screen.
      </Text>
      <Text>
        Each coloured line represents a different direction, or dimension,
        you're moving the micro:bit in.
      </Text>
      <Image w="xs" src={microbitXYXImage} />
      <div>
        <Text>Looking at the front of the micro:bit:</Text>
        <UnorderedList>
          <ListItem>x shows movement left and right</ListItem>
          <ListItem>y shows movement up and down</ListItem>
          <ListItem>z shows movement from front to back.</ListItem>
        </UnorderedList>
      </div>
      <Text>This data is how the AI creator understands how you move.</Text>
      <Text>
        There are three steps to teaching the computer how to use this data to
        recognise different movements you make.
      </Text>
      <h2>Step 1: Add data</h2>
      <img src={addDataImage} />
      <Text>
        Choose at least two different movements, or <strong>actions</strong>, to
        train the AI creator to recognise. Waving and clapping are good actions
        to start with.
      </Text>
      <UnorderedList>
        <ListItem>Name your first action, for example 'wave'.</ListItem>
        <ListItem>Start moving the micro:bit, making the action.</ListItem>
        <ListItem>Click the red button to collect a sample of data.</ListItem>
        <ListItem>
          Collect at least three samples of your first action.
        </ListItem>
        <ListItem>
          Collect at least three samples of one other action, for example
          'clap'.
        </ListItem>
      </UnorderedList>
      <h2>Step 2: Train the model</h2>
      <Text>
        The AI creator analyses your samples of data and makes a set of
        mathematical rules to allow it to estimate which physical action you
        make. These rules make up the machine learning model.
      </Text>
      <Image src={trainModelImage} />
      <h2>Step 3: Test the model</h2>
      <Text>
        This screen shows which action the model estimates that you're making.
      </Text>
      <Image src={testModelImage} />
      <Text>
        The percentage number is how certain the model is that you're making an
        action. High numbers mean the model is very sure you're making that
        action. Lower numbers mean it is less sure.
      </Text>
      <Text>
        Make each of your actions to test the model. If you see low certainty
        numbers, the model may need more data samples. If it has got the
        estimated action <strong>wrong</strong>, you'll also need to add more
        data.
      </Text>
      <Text>
        You can now go back to step 1 to collect more data to make your machine
        learning model more reliable, or recognise other kinds of movement.
      </Text>
    </ResourcePageLayout>
  );
};

export default GetStartedResourcePage;
