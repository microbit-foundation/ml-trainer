<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import ResourcePageLayout from '../components/ResourcePageLayout.svelte';
  import addDataImage from '../imgs/add_data.png';
  import microbitXYXImage from '../imgs/microbit_xyz_arrows.png';
  import testModelImage from '../imgs/test_model.png';
  import trainModelImage from '../imgs/train_model.png';
</script>

<ResourcePageLayout
  title="Get started"
  videoId="ZhUtuuQemFc"
  videoTitleId="resources.getStarted.video">
  <h2>Get connected</h2>
  <p>
    To start using the micro:bit machine learning tool, you need to connect a micro:bit to
    the <strong>micro:bit machine learning tool</strong> web page on your computer.
  </p>
  <p>There are two options for connecting the micro:bit.</p>
  <h3>Option 1: Web Bluetooth</h3>
  <p>The first option uses a Web Bluetooth wireless connection.</p>
  <p>Click on 'Start new session' and follow the instructions on screen.</p>
  <h3>Option 2: micro:bit radio</h3>
  <p>
    If you can't use Bluetooth on your computer, the second option uses a micro:bit radio
    connection instead.
  </p>
  <p>
    Click on 'Start new session', then 'Connect using micro:bit radio instead' and follow
    the instructions on screen.
  </p>
  <p>
    The micro:bit radio option uses two micro:bits. The first micro:bit senses movement.
    It sends movement data using radio to a second micro:bit connected to your computer
    with a USB cable.
  </p>
  <h2>Now you're connected</h2>
  <p>
    Once the micro:bit sensing movement is connected, you'll see a happy face on its LED
    display.
  </p>
  <p>
    As you move the micro:bit, you see live movement data from its accelerometer sensor in
    a graph at the bottom of the screen.
  </p>
  <p>
    Each coloured line represents a different direction, or dimension, you're moving the
    micro:bit in.
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
  <p>This data is how the machine learning tool understands how you move.</p>
  <p>
    There are three steps to teaching the computer how to use this data to recognise
    different movements you make.
  </p>
  <h2>Step 1: Add data</h2>
  <img src={addDataImage} />
  <p>
    Choose at least two different movements, or <strong>actions</strong>, to train the
    machine learning tool to recognise. Waving and clapping are good actions to start
    with.
  </p>
  <ul class="list-disc list-inside">
    <li>Name your first action, for example 'wave'.</li>
    <li>Start moving the micro:bit, making the action.</li>
    <li>Click the red button to collect a sample of data.</li>
    <li>Collect at least three samples of your first action.</li>
    <li>Collect at least three samples of one other action, for example 'clap'.</li>
  </ul>
  <h2>Step 2: Train the model</h2>
  <p>
    The machine learning tool analyses your samples of data and makes a set of
    mathematical rules to allow it to estimate which physical action you make. These rules
    make up the machine learning model.
  </p>
  <img src={trainModelImage} />
  <h2>Step 3: Test the model</h2>
  <p>This screen shows which action the model estimates that you're making.</p>
  <img src={testModelImage} />
  <p>
    The percentage number is how certain the model is that you're making an action. High
    numbers mean the model is very sure you're making that action. Lower numbers mean it
    is less sure.
  </p>
  <p>
    Make each of your actions to test the model. If you see low certainty numbers, the
    model may need more data samples. If it has got the estimated action <strong
      >wrong</strong
    >, you'll also need to add more data.
  </p>
  <p>
    You can now go back to step 1 to collect more data to make your machine learning model
    more reliable, or recognise other kinds of movement.
  </p>
</ResourcePageLayout>
