import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Variable Highlighting Extension
export const VariableHighlight = Extension.create({
  name: "variableHighlight",
  addOptions() {
    return {
      onVariableClick: null,
      currentVariables: [],
    };
  },
  addProseMirrorPlugins() {
    const { onVariableClick, currentVariables } = this.options;
    return [
      new Plugin({
        key: new PluginKey("variableHighlight"),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, decorationSet) {
            const doc = tr.doc;
            const decorations: any[] = [];
            const variableIds = new Set(
              currentVariables.map((v: any) => v.unique_id)
            );
            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const text = node.text;
                const variableRegex = /\{\{([^}]+)\}\}/g;
                let match;
                while ((match = variableRegex.exec(text)) !== null) {
                  const variableId = (match[1] || "").trim();
                  const isKnownVariable = variableIds.has(variableId);
                  const decoration = Decoration.inline(
                    pos + match.index,
                    pos + match.index + match[0].length,
                    {
                      class: `variable-highlight ${
                        isKnownVariable ? "known-variable" : "unknown-variable"
                      }`,
                      "data-variable-id": variableId,
                    }
                  );
                  decorations.push(decoration);
                }
              }
            });
            return DecorationSet.create(doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          handleClick(view, pos, event) {
            const target = event.target as HTMLElement;
            if (
              target?.classList?.contains("variable-highlight") ||
              target?.hasAttribute("data-variable-id")
            ) {
              const variableId =
                target?.getAttribute("data-variable-id") ||
                target?.dataset?.variableId;
              if (variableId && onVariableClick) {
                onVariableClick(variableId);
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});
