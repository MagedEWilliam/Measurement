// This plugin will open a window to prompt the user to enter a unit and a factor,
// and it will then create that many measurements on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg) => {
  // Recalculate, will update the measurement
  if (msg.type === "recalculate") {
    figma.currentPage.selection.map(async (node: any) => {
      const get_text = node.children
      .filter((node) => node.type === "TEXT")[0];

      if (get_text) {
        await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
        get_text.autoRename = true;

        get_text.deleteCharacters(0, get_text.characters.length);
        get_text.insertCharacters(
          get_text.characters.length,
          Math.round(node.width * msg.factor).toString() + msg.unit,
          "BEFORE"
        );

        node.name =
          "<-" +
          Math.round(node.width * msg.factor).toString() +
          msg.unit +
          "->";
      }
    });
  }

  // Create, Will create a new measurement.
  if (msg.type === "create") {
    let measurement = figma.createFrame();
    let extensionLine_1 = figma.createLine();
    let extensionLine_2 = figma.createLine();
    let dimension = figma.createFrame();
    let dimensionLine = figma.createLine();
    let dimensionText = figma.createText();

    extensionLine_1.rotation = 90 + 180;
    extensionLine_2.rotation = 90;

    dimension.appendChild(extensionLine_1);
    dimension.appendChild(dimensionLine);
    dimension.appendChild(extensionLine_2);
    measurement.appendChild(dimensionText);
    measurement.appendChild(dimension);

    let fill_transparent: any = [
      { type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0 },
    ];
    dimension.fills = fill_transparent;
    measurement.fills = fill_transparent;

    await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
    dimensionText.insertCharacters(0, "100cm");

    measurement.layoutMode = "HORIZONTAL";
    measurement.primaryAxisAlignItems = "CENTER";
    measurement.primaryAxisSizingMode = "AUTO";
    measurement.counterAxisAlignItems = "CENTER";
    measurement.layoutAlign = "INHERIT";
    measurement.layoutGrow = 0;
    measurement.clipsContent = false;
    
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
    
    extensionLine_1.strokeWeight = 0.4;
    extensionLine_2.strokeWeight = 0.4;
    
    extensionLine_1.layoutAlign = "STRETCH";
    extensionLine_2.layoutAlign = "STRETCH";
    
    measurement.name = "<-100cm->";
    dimension.name = "Dimension";
    extensionLine_1.name = "ExtensionLine_1";
    extensionLine_2.name = "ExtensionLine_2";
    dimensionLine.name = "DimensionLine";

    if(!msg.withExtensionLine){
      extensionLine_1.visible = false;
      extensionLine_2.visible = false;
    }
    
    measurement.resize(100, 32);
    measurement.x = figma.viewport.center.x - (measurement.width/2);
    measurement.y = figma.viewport.center.y - (measurement.height/2);
    measurement.layoutMode = "VERTICAL";
  }

  // This makes sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  if (msg.type === "cancel") {
    figma.closePlugin();
  }
};
