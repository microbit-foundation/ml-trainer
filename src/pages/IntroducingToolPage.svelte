<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import ResourcePageLayout from '../components/ResourcePageLayout.svelte';
  import dataRecordedImage from '../imgs/data_recorded.png';
  import microbitXYXImage from '../imgs/microbit_xyz_arrows.png';
</script>

<ResourcePageLayout title="Introducing the micro:bit machine learning tool">
  <p>
    The <b>micro:bit machine learning tool</b> introduces students to machine learning (ML)
    concepts through physical movement and data, a topic familiar from mathematics and science.
  </p>
  <p>
    It allows students to quickly teach a computer to tell the difference between
    different physical movements, such as waving and clapping, using data captured by a
    BBC micro:bit.
  </p>
  <p>
    Students collect samples of data of different movements and label them, so the
    computer knows which sets of data represent which movements.
  </p>
  <p>
    The computer learns to recognise different movements by analysing the data samples,
    and creating a set of rules called a <b>model</b>. This process of collecting and
    labelling data to build a model is called <b>training</b> a machine learning model.
  </p>
  <p>
    Students then test and improve the model. This enables learning about the importance
    of collecting enough data from diverse sources when designing and making ML systems.
  </p>
  <p>
    The micro:bit machine learning tool is co-designed and tested in classrooms in Denmark
    and the United Kingdom by Aarhus University and the Micro:bit Educational Foundation.
  </p>
  <p>
    There are no downloads, no logins. You just need the Chrome or Edge web browser and a
    micro:bit - or two micro:bits if your computer doesn’t have Bluetooth enabled.
  </p>
  <h2>How it works</h2>
  <p>
    The BBC micro:bit has a built-in accelerometer, a movement sensor also found in phones
    and fitness trackers. It measures movement in three dimensions: x, y and z.
  </p>
  <img class="w-xs" src={microbitXYXImage} />
  <div>
    <p>Looking at the front of the micro:bit:</p>
    <ul class="list-disc list-inside">
      <li>x shows movement left and right</li>
      <li>y shows movement up and down</li>
      <li>z shows movement from front to back.</li>
    </ul>
  </div>
  <p>
    Students hold or wear a micro:bit that sends movement data to the machine learning
    tool. They see their physical movement captured as data in real time, as moving lines
    on a graph. Making the connection between moving your body and seeing your movements
    captured and visualised as the computer sees it, as data, is a powerful, immersive
    experience.
  </p>
  <p>
    To create an ML model, students record samples of data of different types of
    movements, such as waving or clapping. We call these different movements ‘actions’.
    Students label each set of actions so the computer knows which sets of data represent
    which kinds of movement.
  </p>
  <img src={dataRecordedImage} />
  <p>
    Students then use the data they have collected to train and test a machine learning
    model running in the web browser.
  </p>
  <p>
    They’ll discover that to work well, successfully telling one action from another, the
    model needs plenty of data. They’ll also find that to work for different people, who
    move in different ways, the training data needs to be collected from as many different
    people as possible.
  </p>
  <p>
    They can then improve the model by recording more samples of movement data, training
    and testing the machine learning model again.
  </p>
  <p>
    Try it out for yourself, to see how quick and easy it is to get started. The video and
    short written guide show you how.
  </p>
  <h2>Glossary</h2>
  <p>
    <b>Artificial intelligence:</b> the ability of computer software designed by people to
    perform tasks that usually need human intelligence.
  </p>
  <p><b>Data:</b> information collected for use elsewhere.</p>
  <p>
    <b>Machine learning:</b> the application of AI technology where computer software is designed
    to perform a task quickly and reliably, having been trained by examples of data provided
    by humans. This training process can be described as 'learning' and this is why we use
    the term 'machine learning'.
  </p>
  <p>
    <b>Machine learning model:</b> a set of rules developed by a machine learning system to
    categorise data.
  </p>
  <p>
    <b>Training a machine learning model:</b> providing samples of data categorised and labelled
    by humans to help machine learning software to build a model.
  </p>
  <p>
    <b>Testing a machine learning model:</b> evaluating a machine learning model against labelled
    or known data to see if it is correctly categorising that labelled or known data. If it
    is not correct, it may need further training data.
  </p>
</ResourcePageLayout>
