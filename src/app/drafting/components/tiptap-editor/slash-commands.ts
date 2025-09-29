import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import type { Editor } from "@tiptap/core";

type CommandItem = {
  title: string;
  keywords?: string[];
  run: (editor: Editor) => void;
};

export const getBaseCommands = (editor: Editor): CommandItem[] => [
  {
    title: "Text",
    keywords: ["paragraph", "text"],
    run: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    title: "Heading 1",
    keywords: ["h1", "heading1"],
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    keywords: ["h2", "heading2"],
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Bullet List",
    keywords: ["ul", "list"],
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    keywords: ["ol", "ordered", "list"],
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "Blockquote",
    keywords: ["quote"],
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    keywords: ["code"],
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    keywords: ["hr", "divider"],
    run: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    title: "Insert Table",
    keywords: ["table"],
    run: (e) =>
      e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];

export const SlashCommands = Extension.create({
  name: "slashCommands",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        allowSpaces: false,
        command: ({ editor, range, props }: any) => {
          props.run(editor);
          editor.chain().focus().deleteRange({ from: range.from, to: range.to }).run();
        },
        items: ({ query, editor }: any) => {
          const items = getBaseCommands(editor);
          if (!query) return items;
          const q = String(query || "").toLowerCase();
          return items.filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              i.keywords?.some((k) => k.toLowerCase().includes(q))
          );
        },
        render: () => {
          let component: HTMLDivElement | null = null;
          let onKeyDown: ((props: any) => boolean) | null = null;

          return {
            onStart: (props: any) => {
              component = document.createElement("div");
              component.className =
                "z-50 border bg-white shadow-md rounded-md p-1 text-sm";
              document.body.appendChild(component);
              renderList(component, props);
            },
            onUpdate(props: any) {
              if (!component) return;
              renderList(component, props);
            },
            onKeyDown(props: any) {
              if (onKeyDown) return onKeyDown(props);
              return false;
            },
            onExit() {
              if (!component) return;
              component.remove();
              component = null;
            },
          };

          function renderList(container: HTMLDivElement, props: any) {
            const { clientRect, items, command } = props;
            if (clientRect) {
              const rect = clientRect();
              if (rect) {
                Object.assign(container.style, {
                  position: "absolute",
                  left: `${rect.left}px`,
                  top: `${rect.bottom + 6}px`,
                });
              }
            }
            container.innerHTML = "";

            const list = document.createElement("div");
            list.style.maxHeight = "240px";
            list.style.overflow = "auto";

            (items || []).forEach((item: any, idx: number) => {
              const el = document.createElement("button");
              el.type = "button";
              el.className =
                "block w-full text-left px-3 py-2 hover:bg-gray-100 rounded";
              el.textContent = item.title;
              el.addEventListener("click", () => command(item));
              list.appendChild(el);
              if (idx === 0) el.focus();
            });

            container.appendChild(list);

            onKeyDown = ({ event }: any) => {
              if (event.key === "Enter") {
                const first = (items || [])[0];
                if (first) command(first);
                return true;
              }
              if (event.key === "Escape") {
                props.editor.commands.focus();
                return true;
              }
              return false;
            };
          }
        },
      } as unknown as Parameters<typeof Suggestion>[0],
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor as any,
        ...(this.options as any).suggestion,
      }),
    ];
  },
});


