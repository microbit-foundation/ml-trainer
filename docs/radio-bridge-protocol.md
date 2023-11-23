# Radio Bridge Protocol

## Context

The current method of connecting a Micro:bit to the ML web app is via Web Bluetooth. The issue with this is that Web Bluetooth may not be enabled/available on many systems that are used in schools, which is the primary use-case for the ML trainer web app. It would also be beneficial to be able to handle multiple Micro:bit connections without having to change the design of the web app too much from its current state.

## Proposed solution

The solution to this could be a single "bridge" Micro:bit connected to a host computer via WebUSB. Micro:bits used in the classroom that need to connect to the ML trainer web app would then connect to the bridge Micro:bit via the Micro:bits' radio connection. The bridge would recieve streaming data from one Micro:bit in the classroom at a time and forward this data onto the web app using a message format that we have designed. The connections to the Micro:bits in the classroom are managed solely by the bridge Micro:bit.

## The message format

Data is streamed to/from the Micro:bit and web app via serial data over USB.

### Delimiter

The messages will need to be delimited by a character for example a newline.

```
\n
```

### Handshake request from web app, response from Micro:bit

In order to connect the bridge Micro:bit to the web app, a handshake should be performed. This confirms that the bridge Micro:bit is already running the correct binary, so the flashing step for the Micro:bit can be skipped.

Handshake request:
```
Req
```

Handshake response
```
Ack
```

### Sending LED matrix data

The web app has "triggers" that send LED data to the Micro:bit when a particular action is detected.

```
LED[1,1,0,1,1,0,0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1]
```

### Sending Pin data

The web app has "triggers" that send the PIN "up" or "down" state when a particular action is detected.

Requirements: send pin data "always on" or for set amount of time.

```

```

### Streaming accelerometer & button data from Micro:bit to web app

The state of the accelerometer and buttons will be streamed:
```
AX[408],AY[748],AZ[-1288],BA[0],BB[1],BL[0]
```

## WebUSB or Web Serial?

### Web Serial

#### Pros:
* Reliable connection designed for streaming serial data.
* Easy to initialise.

#### Cons:
* Would need multiple connection steps, because we still need WebUSB for flashing the binary to the device.

### WebUSB

#### Pros:
* Only need to connect to USB a single time.
* Handshake may be simpler as we would only need to connect once, instead of 3 times - Web Serial for handshake, WebUSB for flashing binary, then back to Web Serial for data streaming.
    * Could this could be mitigated to 2 steps by doing the handshake via WebUSB instead? May be a weird experience for user to connect to WebUSB _just_ for the handshake, then immediately have to connect to Web Serial.

#### Cons:
* WebUSB not designed for streaming serial data. Current implementation by Arm prone to packet loss.
* Extra work to make this function reliably?
* Need to understand performance - would this method be more CPU bound?

## Sample rate of messages

## Event-based, polling-based, or request/response message listening in web app?

The current Bluetooth implementation is event-based and listens to a "data changed" event so the data is only processed when when the values change. Web Bluetooth has a data rate of around 24Mbps, which gives plenty enough resolution for the simple data messages we are processing in the web app.

The Web Serial interface only gives a polling method for recieving the data, so we will have to process the data as it comes in. We could always abstract over the top of this with our own custom event, and only fire that event off if we have detected that the data has changed. We may not need to do this from a performance optimisation point-of-view, but it could help make the interface consistent with the existing Web Bluetooth one.

An alternative approach would be a request/response pattern where the web app would requests specific data from the Micro:bit and then the Micro:bit would respond with the requested data. This could create more overhead in the communication between the bridge and the web app.
