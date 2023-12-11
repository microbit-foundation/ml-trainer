/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

const TRANSLATION_NEEDED = "TRANSLATION NEEDED"

type TranslationMap = { [localeCode: string]: { [translationId: string]: string } }

export const translations: TranslationMap = {
	"da": { // APPROXIMATE SORTING ORDER: First alphabetically, then order of appearance from top to bottom of page
		// ALERTS:
		//In gesture.svelte
		"alert.data.classNameLengthAlert": "Navne må kun bestå af {{maxLen}} tegn",
		"alert.recording.disconnectedDuringRecording":"micro:bit frakoblede under optagelse",

		//In common.js
		"alert.isRecording": "Du er i gang med at optage!",
		"alert.isTesting": "Du er i gang med at optage!",
		"alert.isTraining": "Du er i gang med at træne en model!",
		"alert.isNotConnected": "Din Micro:bit skal være tilsluttet!",
		"alert.deleteGestureConfirm": "Er du sikker på at du vil slette klassen ",

		//In ml.ts
		"alert.twoGestures": "Du skal have mindst to klasser",
		"alert.oneDataRepresentation": "Du skal have mindst en data-repræsentation",
		"alert.recordingsPerGesture": "Du skal have mindst tre eksempler for hver klasse",

		// HOME PAGE:
		"content.index.title": TRANSLATION_NEEDED,
		"content.index.toolInfo1": TRANSLATION_NEEDED,
		"content.index.toolInfo2": TRANSLATION_NEEDED,
		"content.index.toolProcessCards.main.title": TRANSLATION_NEEDED,
		"content.index.toolProcessCards.data.title": TRANSLATION_NEEDED,
		"content.index.toolProcessCards.data.description": TRANSLATION_NEEDED,
		"content.index.toolProcessCards.train.title": TRANSLATION_NEEDED,
		"content.index.toolProcessCards.train.description": TRANSLATION_NEEDED,
		"content.index.toolProcessCards.model.title": TRANSLATION_NEEDED,
		"content.index.toolProcessCards.model.description": TRANSLATION_NEEDED,
		"content.index.recordButtonDescription": "\"Optag\"-knap",

		// DATA PAGE:
		"content.data.classPlaceholderNewClass": "Klik for at ændre navnet",
		"content.data.record": "Optag",
		"content.data.addData": "Tilføj data",
		"content.data.classHelpHeader": "Klasse",
		"content.data.classHelpBody": "En klasse beskriver en type af bevægelse. Vi kan optage eksempler af en bestemt type bevægelse og putte eksemplerne i samme klasse. Træneren kan finde mønstre i eksemplerne/dataet og bruge disse mønstre til at træne en model, der kan genkende denne type bevægelse. Flere eksmpler vil typisk reulstere i en bedre model, men overvej på hvor mange forskellige måder en bevægelse kan laves.",
		"content.data.classification": "Klasser",
		"content.data.data": "Data",
		"content.data.choice": "Valg",
		"content.data.choice.header": "Valg af klasse",
		"content.data.choice.body": "Her vælger du, hvilken klasse du vil tilføje data til. Efter at du har valgt en klasse at tilføje data til, kan du trykke på \"Optag\" knappen nedenfor, eller på en af knapperne på din micro:bit for at optage et data-segment. Se billedet nedenfor.",
		"content.data.dataDescription": "Her kan du se din indsamlede data. Generelt vil det være en fordel at have mere data, da dette giver lærings-algoritmen mere infomration at lære ud fra.",
		"content.data.noData": "Du har ingen bevægelser at træne med. Tilføj nogle bevægelser, som du vil træne din BBC micro:bit til at genkende.",

		"content.data.controlbar.button.clearData": "Ryd eksempler",
		"content.data.controlbar.button.clearData.confirm": "Er du sikker på at du vil slette alle eksempler?\nDette kan ikke fortrydes.",
		"content.data.controlbar.button.downloadData": "Download dataset",
		"content.data.controlbar.button.uploadData": "Upload dataset",

		"content.data.recording.button.cancel": TRANSLATION_NEEDED,
		"content.data.recording.description": TRANSLATION_NEEDED,

		"content.data.trainDialog.title": TRANSLATION_NEEDED,
		"content.data.trainDialog.text": TRANSLATION_NEEDED,

		// TRAINER PAGE:
		"content.trainer.failure.header": "Træning mislykkedes",
		"content.trainer.failure.body": "Træningen resulterede ikke i en brugbar model. Grunden til dette ligger sandsynligvis i dataet. Hvis dataet i forskellige klasser minder for meget om hinanden, kan dette resultere i nogle forskellige problemer i træningsprocessen, der ikke gør det muligt at træne modellen ordentligt.",
		"content.trainer.failure.todo": "Gå tilbage til datasiden og ændr i din data.",

		"content.filters.max.title" : "Maksværdier",
		"content.filters.max.description" : "Det højeste punkt blandt alle datapunkter i en bevægelse.",
		"content.filters.min.title" : "Minimumsværdier",
		"content.filters.min.description" : "Det laveste punkt blandt alle datapunkter i en bevægelse.",
		"content.filters.std.title" : "Standardafvigelse",
		"content.filters.std.description" : "Den gennemsnitlige afvigelse fra 0 blandt alle datapunkter i en bevægelse.",
		"content.filters.peaks.title" : "Antal ekstremer",
		"content.filters.peaks.description" : "Antallet af ekstremer blandt alle datapunkter i en bevægelse.",
		"content.filters.acc.title" : "Samlet acceleration",
		"content.filters.acc.description" : "Summen af acceleration for hele bevægelsen, udregnet med absolutte værdier, således at minus tæller som plus. God til at forstå mængden af bevægelse.",
		"content.filters.mean.title" : "Gennemsnit",
		"content.filters.mean.description": "Gennemsnit af acceleration for de forskellige axer.",
		"content.filters.zcr.title" : "Zero crossing rate",
		"content.filters.zcr.description": "Hvor ofte inputer (accelerationen) går fra positiv til negativ eller omvend.t",
		"content.filters.rms.title" : "Effektiv værdi ",
		"content.filters.rms.description": "Root mean square.",

		// MODEL PAGE:
		"content.model.trainModelFirstHeading": "Træn modellen først!",
		"content.model.trainModelFirstBody": "Gå til 'Træner'-siden",
		"content.model.classification.helpHeading": "Sandsynligheds-meteret",
		"content.model.classification.helpBody": "For hver forudsigelse, vil modellen producere et procent-tal, der beskriver hvor sikker modellen er i sin fordusigelse. Dette meter går fra 0% til 100%. Med slideren ved siden af, kan du bestemme grænsen for, hvor sikker modellen skal være i sin forudsigelse for at lave et output (fx afspille en lyd)",
		"content.model.output.soundOptionCongratulations": "Tillykke",
		"content.model.output.soundOptionHighPitchBeep": "Højtone Bip",
		"content.model.output.soundOptionLowPitchBeep": "Lavtone Bip",
		"content.model.output.soundOptionLoser": "Taber",
		"content.model.output.soundOptionMistake": "Fejl",
		"content.model.output.soundOptionHugeMistake": "Kæmpe fejl",

		"content.model.output.pin.option.allTime": "Altid tændt",
		"content.model.output.pin.option.xTime": "Tænd på tid",
		"content.model.output.pin.seconds": "Sekunder",

		"content.model.output.prediction.iconTitle": "Forudsigelse",
		"content.model.output.prediction.descriptionTitle": "Forudsigelse",
		"content.model.output.prediction.descriptionBody": "Her kan du se, hvilken klasse din model forudsiger den nuværende bevægelse til at være. Du kan se i meteret hvor sikker modellen er i sin forudsigelse.",

		"content.model.output.ledOutput.descriptionTitle": "LED output",
		"content.model.output.ledOutput.descriptionBody": "Her kan du vælge, hvordan LED-lysene på din output-micro:bit skal opføre sig, når din model forudsiger en klasse. Prøv at tegne nogle mønstre nedenfor og se, hvordan disse mønstre vises på din output-micro:bit, når du bevæger input-micro:bit'en.",

		"content.model.output.sound.iconTitle": "Lyd",
		"content.model.output.sound.descriptionTitle": "Afspilling af lyd",
		"content.model.output.sound.descriptionBody": "Her kan du vælge hvilken lyd din output-micro:bit skal afspille, når din model laver en forudsigelse. Bemærk at lyden afspilles af din computer, hvis du har en micro:bit version 1.",

		"content.model.output.pin.iconTitle": "Pin",
		"content.model.output.pin.descriptionTitle": "Pin output",
		"content.model.output.pin.descriptionBody": "Her kan du vælge hvilken pin skal tænde når modellen laver en forudsigelse på en bevægelse. Alle pins har numre i overenstemmelse med micro:bits officielle pin diagram.",

		"content.model.output.popup.header": "Tilslut output-micro:bit",
		"content.model.output.popup.body": "Hvis du ikke har tilsluttet en output-micro:bit, kan du ikke se resultatet af de ændringer du laver på denne side. Tilslut nedenfor.",

		// FOOTER:
		"footer.connectButtonNotConnected": TRANSLATION_NEEDED,
		"footer.disconnectButton": "Frakobl",
		"footer.helpHeader": "Live graf",
		"footer.helpContent": "Når du har forbundet en micro:bit kan du live se Accelerometer-data for alle tre akser på denne graf. Prøv at bevæge din forbundende micro:bit og se, hvordan den data der produceres af bevægelserne ser ud for computeren!",
		"footer.reconnecting":"Genopretter forbindelsen. Vent venligst",

		//DATA MENU:
		"menu.data.helpHeading": TRANSLATION_NEEDED,
		"menu.data.helpBody": "For at træne en model til at genkende forskellige bevægelser, skal vi have gode eksempler på 'god opførsel', som vi kan vise træneren. Her kan i oprette klasser (en type bevægelse) og optage eksempler til hver klasse. Der skal være mindst 2 klasser med hver 3 eksempler før træneren kan træne en model.",
		"menu.data.examples": "eksempler",

		// TRAINER MENU:
		"menu.trainer.helpHeading": "Træner",
		"menu.trainer.helpBody": "Træneren kigger på eksemplerne i klasserne og forsøger at 'lære', hvordan de forskellige klasser kan genkendes ved at finde mønstre i dataet. Her kan i træne en model, der kan genkende forskellige bevægelser.", //Derudover kan i indstille træneren, vælge hvordan træneren skal forstå dataet og oprette test-sæt.",
		"menu.trainer.notConnected1": "Du har ikke tilkoblet en BBC micro:bit.",
		"menu.trainer.notConnected2": "Gør dette vha. knappen nedenfor",
		"menu.trainer.notEnoughDataHeader1": "Ikke nok data!\nGå til Data-siden",
		"menu.trainer.notEnoughDataInfoBody": "Der er brug for minimum 2 klasser med 3 eksempler i hver for at kunne træne en model.",
		"menu.trainer.notEnoughDataInfo": "Du har ikke indsamlet nok data til at træne en model. Der er brug for minimum 2 klasser med 3 eksempler i hver. Gå til Data-siden for at indsamle mere data",
		"menu.trainer.trainModelButton": "Træn model",
		"menu.trainer.trainNewModelButton": "Træn en ny model",
		"menu.trainer.TrainingFinished": "Træning færdig",
		"menu.trainer.TrainingFinished.body": "Gå til Model-siden for at undersøge hvor godt din model virker",
		"menu.trainer.isTrainingModelButton": "Træner model...",

		// MODEL MENU:
		"menu.model.helpHeading": TRANSLATION_NEEDED,
		"menu.model.helpBody": "Modellen kan bruges i et interaktivt system. Her bruger vi den trænede model til at forudsige bevægelser. Du kan tilslutte endnu en micro:bit og få den til at reagere på de bevægelser du laver.",
		"menu.model.noModel": "Ingen model",
		"menu.model.disconnect": "Frakobl output-micro:bit",

		// CONNECT MICROBIT:
		"connectMB.nextButton": "Næste",
		"connectMB.backButton": TRANSLATION_NEEDED,

		// RADIO CONNECTION START
		"connectMB.radioStart.heading": TRANSLATION_NEEDED,
		"connectMB.radioStart.requirements1": TRANSLATION_NEEDED,
		"connectMB.radioStart.requirements2": TRANSLATION_NEEDED,
		"connectMB.radioStart.requirements3": TRANSLATION_NEEDED,
		"connectMB.radioStart.requirements4": TRANSLATION_NEEDED,
		"connectMB.radioStart.switchBluetooth": TRANSLATION_NEEDED,

		// BLUETOOTH CONNECTION START
		"connectMB.bluetoothStart.heading": TRANSLATION_NEEDED,
		"connectMB.bluetoothStart.subtitle": TRANSLATION_NEEDED,
		"connectMB.bluetoothStart.requirements1": TRANSLATION_NEEDED,
		"connectMB.bluetoothStart.requirements2": TRANSLATION_NEEDED,
		"connectMB.bluetoothStart.requirements3": TRANSLATION_NEEDED,
		"connectMB.bluetoothStart.requirements4": TRANSLATION_NEEDED,
		"connectMB.bluetoothStart.switchRadio": TRANSLATION_NEEDED,

		// CONNECT CABLE TO MICROBIT
		"connectMB.connectCableMB1.heading": TRANSLATION_NEEDED,
		"connectMB.connectCableMB1.subtitle": TRANSLATION_NEEDED,

		"connectMB.connectCableMB2.heading": TRANSLATION_NEEDED,
		"connectMB.connectCableMB2.subtitle": TRANSLATION_NEEDED,

		"connectMB.connectCable.heading": TRANSLATION_NEEDED,
		"connectMB.connectCable.subtitle": TRANSLATION_NEEDED,

		"connectMB.connectCable.skip": TRANSLATION_NEEDED,

		// SELECT MICROBIT FROM WEB POPUP
		"connectMB.webPopup": TRANSLATION_NEEDED,
		"connectMB.webPopup.instruction1": TRANSLATION_NEEDED,
		"connectMB.webPopup.instruction2": TRANSLATION_NEEDED,

		// DOWNLOADING PROGRAM TO MICROBIT
		"connectMB.usbDownloadingMB1.header": TRANSLATION_NEEDED,
		"connectMB.usbDownloadingMB2.header": TRANSLATION_NEEDED,
		"connectMB.usbDownloading.header": TRANSLATION_NEEDED,
		"connectMB.usbDownloading.subtitle": TRANSLATION_NEEDED,

		// CONNECT BATTERY
		"connectMB.connectBattery.heading": TRANSLATION_NEEDED,
		"connectMB.connectBattery.subtitle": TRANSLATION_NEEDED,

		// BLUETOOTH CONNECTION
		"connectMB.pattern.heading": TRANSLATION_NEEDED,
		"connectMB.pattern.subtitle": TRANSLATION_NEEDED,

		// CONNECTING BLUETOOTH
		"connectMB.bluetooth.heading": "Tilslut med Bluetooth",
		"connectMB.main.bluetooth.subtitle": "Tilslut med Bluetooth",
		"connectMB.bluetooth.cancelledConnection": "Du anullerede forbindelses-processen. Prøv igen hvis du ønsker at fortsætte.",

		"connectMB.bluetooth.connecting": "Tilslutter...",
		"connectMB.bluetooth.invalidPattern": "Mønstret du har tegnet er ikke gyldig",

		"disconnectedWarning.input": "Din input-micro:bit mistede forbindelsen, vil du prøve igen?",
		"disconnectedWarning.output": "Din output-micro:bit mistede forbindelsen, vil du prøve igen?",
		"disconnectedWarning.reconnectButton.input": "Tilslut input igen",
		"disconnectedWarning.reconnectButton.output": "Tilslut output igen",

		// USB CONNECTION PROMPTS:
		"connectMB.output.header": "En micro:bit er allerede forbundet",

		"connectMB.usb.body1": "Tilslut din BBC micro:bit med USB-kabel og tryk på 'næste'",
		"connectMB.usb.body2": "Tryk 'Find USB-enhed' og vælg 'BBC micro:bit CMSIS-DAP' eller 'DAPLink CMSIS-DAP' fra popup-beskeden som kommer",
		"connectMB.usb.button1": "Næste",
		"connectMB.usb.button2": "Find USB-enhed",
		"connectMB.usb.done.body1": "Færdig - programmet er downloadet.",
		"connectMB.usb.done.body2": "Du kan nu tilkoble dig via bluetooth.",
		"connectMB.usb.done.body3": "Hvis du har et batteri til din micro:bit kan du nu tage usb-kablet ud og tilslutte batteriet i stedet.",
		"connectMB.usb.done.body4": "Hvis du ikke har et batteri kan du fortsætte med at give din micro:bit strøm igennem usb-kablet.",

		"connectMB.usb.manual.header": "Overfør fil til din BBC microbit",
		"connectMB.usb.manual.manualDownload": "Hvis filen ikke downloadede automatisk tryk",
		"connectMB.usb.manual.manualDownloadLink": "her",
		"connectMB.usb.manual.done": "Færdig: Tilslut med bluetooth",

		"connectMB.usb.firmwareBroken.warning":"Vi opdagede en fejl med din micro:bit",
		"connectMB.usb.firmwareBroken.content1":"Din version af micro:bit og firmware har velkendte fejl, som forhindre os i at uploade programmet til din micro:bit.",
		"connectMB.usb.firmwareBroken.content2":"For at fortsætte nu skal du overføre programmet manuel eller opdatere din micro:bit",
		"connectMB.usb.firmwareBroken.content3":"Vi anbefaler at du opdatere din micro:bit's firmware version til den nyeste for rette op på denne fejl.",
		"connectMB.usb.firmwareBroken.content4":"Du kan finde en guide til hvordan du gør på ",
		"connectMB.usb.firmwareBroken.content4.website":"micro:bit fondens hjemmeside",
		"connectMB.usb.firmwareBroken.button.skip":"Spring over og overfør manuelt",

		"connectMB.outputMB.same": "Brug samme BBC micro:bit",
		"connectMB.outputMB.different": "Tilslut anden BBC micro:bit",
		"connectMB.outputMB.sameButton": "Samme",
		"connectMB.outputMB.otherButton": "Anden",

		// COMPATIBILITY WARNING
		"popup.compatibility.bluetooth.header": "Browser ikke understøttet!",
		"popup.compatibility.bluetooth.explain": "Din nuværende browser understøtter ikke bluetooth. Bluetooth bruges til at drive siden. Uden det virker den ikke.",
		"popup.compatibility.bluetooth.advice": "Sikre at din browser er opdateret. Ellers kan du vælge en af de nedestående browsere, som understøtter bluetooth.",

		"connectMB.USBCompatibility.transferStep.step1": "Åben placering af den firmware fil du lige har downloadet. Den findes oftest i din download mappe.",
		"connectMB.USBCompatibility.transferStep.step2": "Træk filen over i micro:bit'en gennem din computers stifinder.",
		"connectMB.USBCompatibility.transferStep.step3": "Når overførslen er færdig, kan du tilslutte din micro:bit med Bluetooth.",

		"compatibility.platform.notSupported": "Værktøjet er ikke understøttet på din nuværende platform.",
		"compatibility.platform.notSupported.joinDesktop": "Vi ses på computer.",
		"compatibility.webgl.notSupported": "WebGL er ikke tilgængelig. Aktiver WebGL for at se 3D data.",

		// CONNECTION LOST DIALOG
		"dialog.connection.lost.header": "Forbindelse offline",
		"dialog.connection.lost.body": "Vi kan ikke oprette forbindelse til internettet, nogle funktioner virker muligvis ikke som forventet.",

		// OUTDATED MICROBIT WARNING
		"popup.outdatedmicrobit.header": "Din micro:bit mangler en opdatering.",
		"popup.outdatedmicrobit.text": "Vi anbefaler stærkt at opdatere nu, nogle funktioner virker muligvis ikke som forventet.",
		"popup.outdatedmicrobit.text.mkcd": "Åben den nyeste MakeCode skabelon for at bruge den opdaterede MakeCode extension.",
		"popup.outdatedmicrobit.button.later": "Senere",
		"popup.outdatedmicrobit.button.update": "Opdatér nu",
		"popup.outdatedmicrobit.button.update.mkcd": "Åben MakeCode",
	},
	"en": {
		// ALERTS:
		//In gesture.svelte
		"alert.data.classNameLengthAlert": "Names must consists of maximum {{maxLen}} characters.",
		"alert.recording.disconnectedDuringRecording":"micro:bit disconnected during recording",

		//In common.js
		"alert.isRecording": "You are currently recording!",
		"alert.isTesting": "You are currently recording!",
		"alert.isTraining": "You are currently training a model!",
		"alert.isNotConnected": "Your Micro:bit should be connected!",
		"alert.deleteGestureConfirm": "Are you sure you want to delete the class ",

		//In ml.ts
		"alert.twoGestures": "You need at least two classes",
		"alert.oneDataRepresentation": "You need at least one data representation",
		"alert.recordingsPerGesture": "You need at least three examples per class",

		// HOME PAGE:
		"content.index.title": "machine learning tool",
		"content.index.toolInfo1": "Use this tool with the",
		"content.index.toolInfo2": "BBC micro:bit playground survey",
		"content.index.toolProcessCards.main.title": "How this tool works",
		"content.index.toolProcessCards.data.title": "Add data",
		"content.index.toolProcessCards.data.description": "Add samples of the actions you would like your model to recognise (e.g. waving and clapping).",
		"content.index.toolProcessCards.train.title": "Train model",
		"content.index.toolProcessCards.train.description": "Ask the computer to use your training samples to train the machine learning model to recognise different actions.",
		"content.index.toolProcessCards.model.title": "Test model",
		"content.index.toolProcessCards.model.description": "Find out if it correctly recognises each action. Add more data to improve the model.",
		"content.index.recordButtonDescription": "\"Record\"-button",

		// DATA PAGE:
		"content.data.classPlaceholderNewClass": "Press here to change name",
		"content.data.record": "Record",
		"content.data.addData": "Add Data",
		"content.data.classHelpHeader": "Class",
		"content.data.classHelpBody": "A class describes a type of gesture. We can record examples of a certain type of gesture and put the examples in the same class. The trainer can find patterns in the examples/data and use these patterns to 'train' a model that can recognize this class of gestures. Multiple examples will typically result in a better model, and consider how many different ways a gesture can be performed.",
		"content.data.classification": "Classes",
		"content.data.data": "Data",
		"content.data.choice": "Choice",
		"content.data.choice.header": "Choice of class",
		"content.data.choice.body": "Here, you choose which class you want to add data to. After having selected a class, you can either press the \"Record\" button below or press one of the buttons on your micro:bit to record a data segment. See the picture below.",

		"content.data.dataDescription": "Here you can see the gathered data. ",
		"content.data.noData": "You do not have any gestures to train on. Add the gestures you wish the micro:bit should learn to recognise.",

		"content.data.controlbar.button.clearData": "Clear examples",
		"content.data.controlbar.button.clearData.confirm": "Are you sure you wish to delete all gesture examples?\nThis cannot be undone.",
		"content.data.controlbar.button.downloadData": "Download dataset",
		"content.data.controlbar.button.uploadData": "Upload dataset",

		"content.data.recording.button.cancel": "Cancel recording",
		"content.data.recording.description": "Start action before the countdown finishes",

		"content.data.trainDialog.title": "Train the model",
		"content.data.trainDialog.text": "Do you want to train the model with the data you have added so you can test it?",

		// TRAINER PAGE:
		"content.trainer.failure.header": "Training Failed",
		"content.trainer.failure.body": "The training did not result in a usable model. The reason for this is most likely the data used for training. If the data for different classes are too similar, this can result in issues in the training process.",
		"content.trainer.failure.todo": "Return to the data page and change your data.",

		"content.filters.max.title" : "Max values",
		"content.filters.max.description" : "The tallest point among all datapoints in a gesture.",
		"content.filters.min.title" : "Minimum values",
		"content.filters.min.description" : "The lowest point among all datapoints in a gesture.",
		"content.filters.std.title" : "Standard deviation",
		"content.filters.std.description" : "The average deviation from 0 among all datapoints in a gesture.",
		"content.filters.peaks.title" : "Number of extremes",
		"content.filters.peaks.description" : "The number of extremes among all datapoints in a gesture.",
		"content.filters.acc.title" : "Total acceleration",
		"content.filters.acc.description" : "The sum of acceleration for the whole gesture, calculated in absolute values, so that minus counts as plus. Good for understanding the amount of movement.",
		"content.filters.mean.title" : "Mean",
		"content.filters.mean.description": "Mean value of accelerations at different axes",
		"content.filters.zcr.title" : "Zero crossing rate",
		"content.filters.zcr.description": "The rate at which the input (acceleration) transitions from positive to zero to negative or negative to zero to positive.",
		"content.filters.rms.title" : "Root mean square",
		"content.filters.rms.description": "",

		// MODEL PAGE:
		"content.model.trainModelFirstHeading": "Train the model first!",
		"content.model.trainModelFirstBody": "Go to the 'Trainer' page",
		"content.model.classification.helpHeading": "Probabil-ometer",
		"content.model.classification.helpBody": "For each prediction you make, the model will produce a percentage that describes how confident the model is in its prediction. This meter goes from 0% to 100%. With the slider next to it, you can determine the limit of how certain the model should be in its preduction to make an output (e.g. play a sound)",
		"content.model.output.soundOptionCongratulations": "Congratulations",
		"content.model.output.soundOptionHighPitchBeep": "High pitch beep",
		"content.model.output.soundOptionLowPitchBeep": "Low pitch beep",
		"content.model.output.soundOptionLoser": "Loser",
		"content.model.output.soundOptionMistake": "Mistake",
		"content.model.output.soundOptionHugeMistake": "Huge Mistake",

		"content.model.output.pin.option.allTime": "Always on",
		"content.model.output.pin.option.xTime": "For time",
		"content.model.output.pin.seconds": "Seconds",

		"content.model.output.prediction.iconTitle": "Prediction",
		"content.model.output.prediction.descriptionTitle": "Prediction",
		"content.model.output.prediction.descriptionBody": "Here you can see the model's prediction of the current gesture. In the meter, you can see how confident the model is in the prediction.",

		"content.model.output.ledOutput.descriptionTitle": "LED output",
		"content.model.output.ledOutput.descriptionBody": "Here you can choose how the LEDs on your output micro:bit behaves when your model makes predictions. Try draw some patterns and see how they show on the output micro:bit when you move the input micro:bit.",

		"content.model.output.sound.iconTitle": "Sound",
		"content.model.output.sound.descriptionTitle": "Playback of sound",
		"content.model.output.sound.descriptionBody": "Here you can choose which sound you output micro:bit plays when the model makes a prediction. Be aware that the sound plays from your computer if you have a micro:bit version 1.",

		"content.model.output.pin.iconTitle": "Pin",
		"content.model.output.pin.descriptionTitle": "Pin outputs",
		"content.model.output.pin.descriptionBody": "Here you can select which pin will turn on when a gesture is predicted. Each pins are numbered according to micro:bit's official pin output diagram.",

		"content.model.output.popup.header": "Connect output micro:bit",
		"content.model.output.popup.body": "If you have not connected an output micro:bit, you cannot see the results of the changed made on this page. Use the connect button below",

		// FOOTER:
		"footer.connectButtonNotConnected": "Start",
		"footer.disconnectButton": "Disconnect",
		"footer.helpHeader": "Live graph",
		"footer.helpContent": "Once you have connected a micro:bit you can watch the accelerometer data for all three axes on this graph in real time. Try moving your connected micro:bit to see what the data looks like to your computer!",
		"footer.reconnecting":"Reconnecting. Please wait",

		//DATA MENU:
		"menu.data.helpHeading": "Data",
		"menu.data.helpBody": "In order to train a model to recognize different movements, we need good examples of 'good behavior' that we can show the Trainer. Here you can create classes (types of gestures) and record examples for each class. There must be at least 2 classes with 3 examples each before the trainer can train a model.",
		"menu.data.examples": "examples",

		// TRAINER MENU:
		"menu.trainer.helpHeading": "Trainer",
		"menu.trainer.helpBody": "The Trainer looks at the examples in each of the classes and tries to 'learn' how the different classes can be recognized by searching for patterns in the data. Here you can train a model to recognize different gestures.", // In addition, you can configure the trainer, choose how the trainer should interpret the data and create test sets.",
		"menu.trainer.notConnected1": "You have not connected a micro:bit.",
		"menu.trainer.notConnected2": " Please do so via the button below",
		"menu.trainer.notEnoughDataHeader1": "Not Enough Data\nGo to Data page",
		"menu.trainer.notEnoughDataInfoBody": "You need at least 2 classes with 3 examples each to attempt to train a model.",
		"menu.trainer.notEnoughDataInfo": "You have not collected enough data to train a model. You need at least 2 classes with 3 examples each. Please go to the Data page to collect more data",
		"menu.trainer.trainModelButton": "Train model",
		"menu.trainer.trainNewModelButton": "Train a new model",
		"menu.trainer.TrainingFinished": "Training done",
		"menu.trainer.TrainingFinished.body": "Go to the Model-page to examine how well your model works",
		"menu.trainer.isTrainingModelButton": "Training model",

		// MODEL MENU:
		"menu.model.helpHeading": "Model",
		"menu.model.helpBody": "The model can be used in an interactive system. Here we use the trained model to predict gestures. You can connect another micro:bit and make it respond to the predicted gestures.",
		"menu.model.noModel": "No model",
		"menu.model.disconnect": "Disconnect output micro:bit",

		// CONNECT MICROBIT:
		"connectMB.nextButton": "Next",
		"connectMB.backButton": "Back",

		// RADIO CONNECTION START
		"connectMB.radioStart.heading": "What you will need to get started:",
		"connectMB.radioStart.requirements1": "2 micro:bits",
		"connectMB.radioStart.requirements2": "Computer",
		"connectMB.radioStart.requirements3": "Micro USB cable",
		"connectMB.radioStart.requirements4": "Battery holder",
		"connectMB.radioStart.switchBluetooth": "I only have one micro:bit",

		// BLUETOOTH CONNECTION START
		"connectMB.bluetoothStart.heading": "If you only have one micro:bit",
		"connectMB.bluetoothStart.subtitle": "You will need to have web Bluetooth enabled on your computer and in your web browser.",
		"connectMB.bluetoothStart.requirements1": "1 micro:bit",
		"connectMB.bluetoothStart.requirements2": "Computer",
		"connectMB.bluetoothStart.requirements3": "Micro USB cable",
		"connectMB.bluetoothStart.requirements4": "Battery holder",
		"connectMB.bluetoothStart.switchRadio": "I have two micro:bits",

		// CONNECT CABLE TO MICROBIT
		"connectMB.connectCableMB1.heading": "Connect cable to micro:bit 1",
		"connectMB.connectCableMB1.subtitle": "Connect the first micro:bit to this computer with a USB cable so that the <brand name> program can be downloaded to it.",

		"connectMB.connectCableMB2.heading": "Connect cable to micro:bit 2",
		"connectMB.connectCableMB2.subtitle": "Connect a second micro:bit to this computer with a USB cable.",

		"connectMB.connectCable.heading": "Connect cable",
		"connectMB.connectCable.subtitle": "Connect a micro:bit to this computer with a USB cable so that the <brand name> program can be downloaded to it.",

		"connectMB.connectCable.skip": "Skip: program already downloaded?",

		// SELECT MICROBIT FROM WEB POPUP
		"connectMB.webPopup":"Select micro:bit",
		"connectMB.webPopup.instruction1": "Choose your micro:bit",
		"connectMB.webPopup.instruction2": "Select 'Connect'",

		// DOWNLOADING PROGRAM TO MICROBIT
		"connectMB.usbDownloadingMB1.header": "Downloading program to micro:bit 1",
		"connectMB.usbDownloadingMB2.header": "Downloading program to micro:bit 2",
		"connectMB.usbDownloading.header": "Downloading program to micro:bit",
		"connectMB.usbDownloading.subtitle": "Please wait. Downloading program to micro:bit.",

		// CONNECT BATTERY
		"connectMB.connectBattery.heading": "Connect battery pack",
		"connectMB.connectBattery.subtitle": "Disconnect the micro:bit from the computer and connect the battery pack.",

		// BLUETOOTH CONNECTION
		"connectMB.pattern.heading": "Copy pattern",
		"connectMB.pattern.subtitle": "Copy the pattern displayed on the micro:bit",

		// CONNECTING BLUETOOTH
		"connectMB.bluetooth.heading": "Connect using Bluetooth",
		"connectMB.main.bluetooth.subtitle": "Connect using Bluetooth",
		"connectMB.bluetooth.cancelledConnection": "You cancelled the connection process. Try again, if you wish to proceed.",

		"connectMB.bluetooth.connecting": "Connecting...",
		"connectMB.bluetooth.invalidPattern": "The pattern you drew is invalid",

		"disconnectedWarning.input": "Your input micro:bit lost connection, do want to try again?",
		"disconnectedWarning.output": "Your output micro:bit lost connection, do want to try again?",
		"disconnectedWarning.reconnectButton.input": "Reconnect input",
		"disconnectedWarning.reconnectButton.output": "Reconnect output",

		"connectMB.output.header": "A micro:bit is already connected",
		"connectMB.usb.body1": "Connect your micro:bit using a USB-cable and click 'Next'",
		"connectMB.usb.body2": "Click 'Find USB unit' and select 'BBC micro:bit CMSIS-DAP' or 'DAPLink CMSIS-DAP' from the popup that appears",
		"connectMB.usb.button1": "Next",
		"connectMB.usb.button2": "Find USB unit",
		"connectMB.usb.done.body1": "Done - the program has been downloaded.",
		"connectMB.usb.done.body2": "You can now connect through bluetooth.",
		"connectMB.usb.done.body3": "If you have a battery for the micro:bit, you can now remove the usb-cable and use the battery instead.",
		"connectMB.usb.done.body4": "If you do not have a battery for the micro:bit, you can simply keep powering it through the usb cable.",

		"connectMB.usb.manual.header": "Transfer file to your micro:bit",
		"connectMB.usb.manual.manualDownload": "If the file did not automatically download press",
		"connectMB.usb.manual.manualDownloadLink": "here",
		"connectMB.usb.manual.done": "Done: Connect using bluetooth",

		"connectMB.usb.firmwareBroken.warning":"We detected issues with your micro:bit firmware",
		"connectMB.usb.firmwareBroken.content1":"The version of micro:bit and firmware have known issues, that prevent us from uploading the program to it.",
		"connectMB.usb.firmwareBroken.content2":"To proceed, you will have to transfer manually, or update your micro:bit's firmware.",
		"connectMB.usb.firmwareBroken.content3":"We recommend that you upgrade the firmware of your micro:bit to the latest version to fix this issue.",
		"connectMB.usb.firmwareBroken.content4":"A guide on how can be found on the ",
		"connectMB.usb.firmwareBroken.content4.website":"micro:bit foundation's website",
		"connectMB.usb.firmwareBroken.button.skip":"Skip and transfer manually",

		"connectMB.outputMB.same": "Use the same micro:bit",
		"connectMB.outputMB.different": "Connect another micro:bit",
		"connectMB.outputMB.sameButton": "Same",
		"connectMB.outputMB.otherButton": "Other",

		// COMPATIBILITY WARNING
		"popup.compatibility.bluetooth.header": "Bluetooth incompatible browser!",
		"popup.compatibility.bluetooth.explain": "The browser you are currently using does not support bluetooth.",
		"popup.compatibility.bluetooth.advice": "Please update the browser or use another one from our supported browsers list below.",

		"connectMB.USBCompatibility.transferStep.step1": "Open the location to which the firmware was downloaded. Most commonly found in your download folder.",
		"connectMB.USBCompatibility.transferStep.step2": "Drag the file onto the micro:bit on your computer's file explorer.",
		"connectMB.USBCompatibility.transferStep.step3": "Once the file has finished transferring, the micro:bit can be connected using Bluetooth.",

		"compatibility.platform.notSupported": "The tool is not supported on your current platform.",
		"compatibility.platform.notSupported.joinDesktop": "Join us on desktop.",
		"compatibility.webgl.notSupported": "WebGL not available. Enable WebGL to see 3D data view.",

		// CONNECTION LOST DIALOG
		"dialog.connection.lost.header": "Connection offline",
		"dialog.connection.lost.body": "Your internet connection is offline, some features may not work properly",

		// OUTDATED MICROBIT WARNING
		"popup.outdatedmicrobit.header": "Your micro:bit firmware is outdated.",
		"popup.outdatedmicrobit.text": "We strongly recommend that you update it now, as some features may not work as expected.",
		"popup.outdatedmicrobit.text.mkcd": "Open the newest MakeCode template to use the updated extension.",
		"popup.outdatedmicrobit.button.later": "Later",
		"popup.outdatedmicrobit.button.update": "Update now",
		"popup.outdatedmicrobit.button.update.mkcd": "Open MakeCode",
	}
};
