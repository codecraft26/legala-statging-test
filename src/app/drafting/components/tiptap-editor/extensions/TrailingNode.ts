import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

// Ensures the document always ends with a paragraph so users can type below block nodes like tables
export const TrailingNode = Extension.create({
  name: "trailingNode",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("trailingNode"),
        appendTransaction: (_transactions, _oldState, newState) => {
          const { doc, tr, schema } = newState;
          const lastChild = doc.lastChild;

          if (!lastChild) {
            return null;
          }

          // If the last node is already a paragraph and is empty, do nothing
          if (lastChild.type.name === "paragraph") {
            return null;
          }

          // Insert an empty paragraph at the end
          const paragraph = schema.nodes.paragraph.create();
          tr.insert(doc.content.size, paragraph);
          return tr;
        },
      }),
    ];
  },
});


