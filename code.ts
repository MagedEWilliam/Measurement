// This plugin will open a window to prompt the user to enter a unit and a precision,
// and it will then create that many measurements on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 350, height: 225 });

(async () => {
  const raw_measurement_options = await figma.clientStorage.getAsync(
    "measurement_options"
  );
  const measurement_options = JSON.parse(raw_measurement_options);
  figma.ui.postMessage({
    type: "measurement_clientStorage",
    ...measurement_options,
  });
})();

// Save setting before closing the plugin
const saveSettings = async (msg) => {
  return await figma.clientStorage.setAsync(
    "measurement_options",
    JSON.stringify({
      unit: msg.unit,
      factor: msg.factor,
      precision: msg.precision,
      withExtensionLine: msg.withExtensionLine,
      lineWidth: msg.lineWidth,
      selectedID: msg.selectedID,
      lineColor: msg.lineColor,
    })
  );
};


const recalculate = async(msg)=>{
  figma.currentPage.selection.map( (selectionNode: any) => {
    const color = figma.util.solidPaint(msg.lineColor);

    selectionNode.children.filter(async(node) => {
      
      if(node.type === "TEXT"){
        // @ts-ignore
        await figma.loadFontAsync(node.fontName);

        node.fills = [color];

        if (node) {
          const updatedText = 
          Number(node.width * Number(msg.factor))
            .toFixed(Number(msg.precision))
            .toString() + msg.unit;
          
          node.autoRename = true;
          
          node.deleteCharacters(0, node.characters.length);
          node.insertCharacters(
            node.characters.length,
            updatedText,
            "BEFORE"
          );
          node.characters = updatedText;

          const textName = "<-" +
          Number(node.width * Number(msg.factor))
            .toFixed(Number(msg.precision))
            .toString() +
          msg.unit +
          "->";

          node.name =textName
          selectionNode.name =textName
        }
      } else {
        node.children.filter(async(dimNode) => {
          dimNode.strokes = [color];
          dimNode.strokeWeight = Number(msg.lineWidth)

          if(dimNode.name.includes('ExtensionLine_')){
            if(msg.withExtensionLine){
              dimNode.opacity = 1
            }else{
              dimNode.opacity = 0
            }
          } else {
          }
        });
      }
    });
  });

  // update localstorage
  saveSettings(msg);
}

const createLine = async (msg) => {
  const measurement = figma.createFrame();
  /**/ const dimensionText = figma.createText();
  /**/ const dimension = figma.createFrame();
  /**/ /**/ const extensionLine_1 = figma.createLine();
  /**/ /**/ const extensionLine_2 = figma.createLine();
  /**/ /**/ const dimensionLine = figma.createLine();

  extensionLine_1.rotation = 90 + 180;
  extensionLine_2.rotation = 90;

  dimension.appendChild(extensionLine_1);
  dimension.appendChild(dimensionLine);
  dimension.appendChild(extensionLine_2);
  measurement.appendChild(dimensionText);
  measurement.appendChild(dimension);

  const fill_transparent: any = [
    { type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0 },
  ];

  measurement.fills = fill_transparent;
  measurement.layoutMode = "HORIZONTAL";
  measurement.primaryAxisAlignItems = "CENTER";
  measurement.primaryAxisSizingMode = "AUTO";
  measurement.counterAxisAlignItems = "CENTER";
  measurement.layoutAlign = "INHERIT";
  measurement.layoutGrow = 0;
  measurement.clipsContent = false;

  dimension.fills = fill_transparent;
  dimension.layoutMode = "HORIZONTAL";
  dimension.primaryAxisAlignItems = "CENTER";
  dimension.primaryAxisSizingMode = "AUTO";
  dimension.counterAxisAlignItems = "MIN";
  dimension.clipsContent = false;
  dimension.layoutAlign = "STRETCH";
  dimension.layoutGrow = 1;
  dimension.locked = true;

  dimensionLine.layoutGrow = 1;
  dimensionLine.layoutAlign = "INHERIT";
  dimensionLine.strokeCap = "ARROW_EQUILATERAL";
  dimensionLine.strokeWeight = Number(msg.lineWidth);
  dimensionLine.strokeWeight = Number(msg.lineWidth);

  const color = figma.util.solidPaint(msg.lineColor);
  
  // Add line color
  dimensionLine.strokes = [color];

  extensionLine_1.strokeWeight = Number(msg.lineWidth);
  extensionLine_2.strokeWeight = Number(msg.lineWidth);
  
  extensionLine_1.strokes = [color];
  extensionLine_2.strokes = [color];

  extensionLine_1.layoutAlign = "STRETCH";
  extensionLine_2.layoutAlign = "STRETCH";

  dimension.name = "Dimension";
  extensionLine_1.name = "ExtensionLine_1";
  extensionLine_2.name = "ExtensionLine_2";
  dimensionLine.name = "DimensionLine";

  if (!msg.withExtensionLine) {
    extensionLine_1.visible = false;
    extensionLine_2.visible = false;
  }

  measurement.resize(100, 41);
  measurement.itemSpacing = 8;
  
  if(msg.selectedID == 'left-line'){
    measurement.rotation = 90;
    dimensionText.rotation = -90;
    measurement.resize(100, 60);
  }
  else if(msg.selectedID == 'right-line'){
    measurement.rotation = -90;
    dimensionText.rotation = 90;
    measurement.resize(100, 60);
  }
  else if(msg.selectedID == 'bottom-line'){
    measurement.rotation = 180;
    dimensionText.rotation = 180;
  }
  
  measurement.x = figma.viewport.center.x - measurement.width / 2;
  measurement.y = figma.viewport.center.y - measurement.height / 2;

  
  figma.currentPage.selection.map(async (node: any) => {
    // @ts-ignore
    await figma.loadFontAsync(dimensionText.fontName);
    dimensionText.fills = [color];

    const widthCalc = Number(node.width * Number(msg.factor))
    .toFixed(Number(msg.precision))
    .toString();

    const heightCalc = Number(node.height * Number(msg.factor))
    .toFixed(Number(msg.precision))
    .toString();

    const unit = msg.unit;

    if(msg.selectedID == 'left-line'){
      measurement.resize(node.height, 78);
      measurement.x = node.x - measurement.height;
      measurement.y = node.y + node.height;

      measurement.name = "<-"+
      heightCalc
      + unit + "->";
      await dimensionText.insertCharacters(0, heightCalc + unit);

    } else if(msg.selectedID == 'right-line'){
      measurement.resize(node.height, 78);
      measurement.x = node.x + node.width + (measurement.height);
      measurement.y = node.y;

      measurement.name = "<-"+
      heightCalc
      + unit + "->";
      await dimensionText.insertCharacters(0, heightCalc + unit);

    } else if(msg.selectedID == 'bottom-line'){
      measurement.resize(node.width, 60);
      measurement.x = node.x + node.width;
      measurement.y = node.y + node.height + (measurement.height);

      measurement.name = "<-"+
      widthCalc
        + unit + "->";
      await dimensionText.insertCharacters(0, widthCalc + unit);
      
    } else if(msg.selectedID == 'top-line'){
      measurement.resize(node.width, 60);
      measurement.x = node.x;
      measurement.y = node.y - measurement.height;

      measurement.name = "<-"+
      widthCalc
       + unit + "->";
      await dimensionText.insertCharacters(0, widthCalc + unit);

    }
  });

  
  measurement.layoutMode = "VERTICAL";

  recalculate(msg);
};

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg) => {
  // Recalculate, will update the measurement
  if (msg.type === "recalculate") {
    recalculate(msg);
  }

  // Create, Will create a new measurement.
  if (msg.type === "create") {
    createLine(msg);
  }

  // no matter the massage was, save the setting.
  saveSettings(msg);
};
