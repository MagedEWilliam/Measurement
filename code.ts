// This plugin will open a window to prompt the user to enter a unit and a precision,
// and it will then create that many measurements on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 400, height: 170 });

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
  await figma.clientStorage.setAsync(
    "measurement_options",
    JSON.stringify({
      unit: msg.unit,
      factor: msg.factor,
      precision: msg.precision,
      withExtensionLine: msg.withExtensionLine,
      lineWidth: msg.lineWidth,
      selectedID: msg.selectedID,
    })
  );
};

const recalculate = async(msg)=>{
  figma.currentPage.selection.map(async (node: any) => {
    const get_text = node.children.filter((node) => node.type === "TEXT")[0];
    // @ts-ignore
    await figma.loadFontAsync(get_text.fontName);
      
    if (get_text) {
      const updatedText = 
      Number(node.width * Number(msg.factor))
        .toFixed(Number(msg.precision))
        .toString() + msg.unit;
      
      get_text.autoRename = true;
      
      get_text.deleteCharacters(0, get_text.characters.length);
      get_text.insertCharacters(
        get_text.characters.length,
        updatedText,
        "BEFORE"
      );
      get_text.characters = updatedText;

      node.name =
        "<-" +
        Number(node.width * Number(msg.factor))
          .toFixed(Number(msg.precision))
          .toString() +
        msg.unit +
        "->";
    }
  });

  await figma.clientStorage.setAsync(
    "measurement_options",
    JSON.stringify({
      unit: msg.unit,
      factor: msg.factor,
      precision: msg.precision,
      withExtensionLine: msg.withExtensionLine,
      lineWidth: msg.lineWidth,
      selectedID: msg.selectedID,
    })
  );
}

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg) => {
  // Recalculate, will update the measurement
  if (msg.type === "recalculate") {
    recalculate(msg);
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

    extensionLine_1.strokeWeight = Number(msg.lineWidth);
    extensionLine_2.strokeWeight = Number(msg.lineWidth);

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

      if(msg.selectedID == 'left-line'){
        measurement.resize(node.height, 78);
        measurement.x = node.x - measurement.height;
        measurement.y = node.y + node.height;

        measurement.name = "<-"+node.height+"px->";
        await dimensionText.insertCharacters(0, node.height+"px");
        // dimensionText.characters =  node.height+"px";

      } else if(msg.selectedID == 'right-line'){
        measurement.resize(node.height, 78);
        measurement.x = node.x + node.width + (measurement.height);
        measurement.y = node.y;

        measurement.name = "<-"+node.height+"px->";
        await dimensionText.insertCharacters(0, node.height+"px");
        // await dimensionText.characters = node.height+"px";
      } else if(msg.selectedID == 'bottom-line'){
        measurement.resize(node.width, 60);
        measurement.x = node.x + node.width;
        measurement.y = node.y + node.height + (measurement.height);

        measurement.name = "<-"+node.width+"px->";
        await dimensionText.insertCharacters(0, node.width+"px");
        // await dimensionText.characters = node.width+"px";
      } else if(msg.selectedID == 'top-line'){
        measurement.resize(node.width, 60);
        measurement.x = node.x;
        measurement.y = node.y - measurement.height;

        measurement.name = "<-"+node.width+"px->";
        await dimensionText.insertCharacters(0, node.width+"px");
        // await dimensionText.characters = node.width+"px";
      }
    });

    
    measurement.layoutMode = "VERTICAL";

    recalculate(msg);
  };

  // Create, Will create a new measurement.
  if (msg.type === "create") {
    createLine(msg);

    await figma.clientStorage.setAsync(
      "measurement_options",
      JSON.stringify({
        unit: msg.unit,
        factor: msg.factor,
        precision: msg.precision,
        withExtensionLine: msg.withExtensionLine,
        lineWidth: msg.lineWidth,
        selectedID: msg.selectedID,
      })
    );
  }

  // no matter the massage was, save the setting.
  saveSettings(msg);
};
