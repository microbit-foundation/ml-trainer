import {
  Heading,
  Image,
  ListItem,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import ResourcePageLayout from "../components/ResourcePageLayout";
import dataRecordedImage from "../images/data_recorded.png";
import microbitXYXImage from "../images/microbit_xyz_arrows.png";
import { introducingToolResouceConfig } from "../pages-config";

const IntroducingToolResourcePage = () => {
  const { id, videoId, videoTitleId } = introducingToolResouceConfig;
  return (
    <ResourcePageLayout id={id} videoId={videoId} videoTitleId={videoTitleId}>
      <Text>
        The <strong>micro:bit AI creator</strong> introduces students to machine
        learning (ML) concepts through physical movement and data, a topic
        familiar from mathematics and science.
      </Text>
      <Text>
        It allows students to quickly teach a computer to tell the difference
        between different physical movements, such as waving and clapping, using
        data captured by a BBC micro:bit.
      </Text>
      <Text>
        Students collect samples of data of different movements and label them,
        so the computer knows which sets of data represent which movements.
      </Text>
      <Text>
        The computer learns to recognise different movements by analysing the
        data samples, and creating a set of rules called a{" "}
        <strong>model</strong>. This process of collecting and labelling data to
        build a model is called <strong>training</strong> a machine learning
        model.
      </Text>
      <Text>
        Students then test and improve the model. This enables learning about
        the importance of collecting enough data from diverse sources when
        designing and making ML systems.
      </Text>
      <Text>
        The micro:bit AI creator is co-designed and tested in classrooms in
        Denmark and the United Kingdom by Aarhus University and the Micro:bit
        Educational Foundation.
      </Text>
      <Text>
        There are no downloads, no logins. You just need the Chrome or Edge web
        browser and a micro:bit - or two micro:bits if your computer doesn’t
        have Bluetooth enabled.
      </Text>
      <Heading as="h2">How it works</Heading>
      <Text>
        The BBC micro:bit has a built-in accelerometer, a movement sensor also
        found in phones and fitness trackers. It measures movement in three
        dimensions: x, y and z.
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
      <Text>
        Students hold or wear a micro:bit that sends movement data to the AI
        creator. They see their physical movement captured as data in real time,
        as moving lines on a graph. Making the connection between moving your
        body and seeing your movements captured and visualised as the computer
        sees it, as data, is a powerful, immersive experience.
      </Text>
      <Text>
        To create an ML model, students record samples of data of different
        types of movements, such as waving or clapping. We call these different
        movements ‘actions’. Students label each set of actions so the computer
        knows which sets of data represent which kinds of movement.
      </Text>
      <Image src={dataRecordedImage} />
      <Text>
        Students then use the data they have collected to train and test a
        machine learning model running in the web browser.
      </Text>
      <Text>
        They’ll discover that to work well, successfully telling one action from
        another, the model needs plenty of data. They’ll also find that to work
        for different people, who move in different ways, the training data
        needs to be collected from as many different people as possible.
      </Text>
      <Text>
        They can then improve the model by recording more samples of movement
        data, training and testing the machine learning model again.
      </Text>
      <Text>
        Try it out for yourself, to see how quick and easy it is to get started.
        The video and short written guide show you how.
      </Text>
      <Heading as="h2">Glossary</Heading>
      <Text>
        <strong>Artificial intelligence:</strong> the ability of computer
        software designed by people to perform tasks that usually need human
        intelligence.
      </Text>
      <Text>
        <strong>Data:</strong> information collected for use elsewhere.
      </Text>
      <Text>
        <strong>Machine learning:</strong> the application of AI technology
        where computer software is designed to perform a task quickly and
        reliably, having been trained by examples of data provided by humans.
        This training process can be described as 'learning' and this is why we
        use the term 'machine learning'.
      </Text>
      <Text>
        <strong>Machine learning model:</strong> a set of rules developed by a
        machine learning system to categorise data.
      </Text>
      <Text>
        <strong>Training a machine learning model:</strong> providing samples of
        data categorised and labelled by humans to help machine learning
        software to build a model.
      </Text>
      <Text>
        <strong>Testing a machine learning model:</strong> evaluating a machine
        learning model against labelled or known data to see if it is correctly
        categorising that labelled or known data. If it is not correct, it may
        need further training data.
      </Text>
    </ResourcePageLayout>
  );
};

export default IntroducingToolResourcePage;
