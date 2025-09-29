import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import type { Editor } from "@tiptap/core";
import {
  Type,
  Hash,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Table,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Image,
} from "lucide-react";

type CommandItem = {
  title: string;
  description: string;
  keywords?: string[];
  icon: React.ComponentType<any>;
  category: string;
  run: (editor: Editor) => void;
};

export const getBaseCommands = (editor: Editor): CommandItem[] => [
  // Text & Headings
  {
    title: "Text",
    description: "Plain text paragraph",
    keywords: ["paragraph", "text", "p"],
    icon: Type,
    category: "Text",
    run: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    keywords: ["h1", "heading1", "title"],
    icon: Hash,
    category: "Text",
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    keywords: ["h2", "heading2", "subtitle"],
    icon: Hash,
    category: "Text",
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    keywords: ["h3", "heading3"],
    icon: Hash,
    category: "Text",
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  
  // Lists
  {
    title: "Bullet List",
    description: "Create a bulleted list",
    keywords: ["ul", "list", "bullets"],
    icon: List,
    category: "Lists",
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    keywords: ["ol", "ordered", "list", "numbers"],
    icon: ListOrdered,
    category: "Lists",
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  
  // Formatting
  {
    title: "Blockquote",
    description: "Create a blockquote",
    keywords: ["quote", "blockquote"],
    icon: Quote,
    category: "Formatting",
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    description: "Create a code block",
    keywords: ["code", "pre", "codeblock"],
    icon: Code,
    category: "Formatting",
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    description: "Add a horizontal line",
    keywords: ["hr", "divider", "line"],
    icon: Minus,
    category: "Formatting",
    run: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  
  // Media & Tables
  {
    title: "Table",
    description: "Insert a table",
    keywords: ["table", "grid"],
    icon: Table,
    category: "Media",
    run: (e) =>
      e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  
  // Text Alignment
  {
    title: "Align Left",
    description: "Align text to the left",
    keywords: ["align", "left", "alignment"],
    icon: AlignLeft,
    category: "Alignment",
    run: (e) => e.chain().focus().setTextAlign("left").run(),
  },
  {
    title: "Align Center",
    description: "Center align text",
    keywords: ["align", "center", "alignment"],
    icon: AlignCenter,
    category: "Alignment",
    run: (e) => e.chain().focus().setTextAlign("center").run(),
  },
  {
    title: "Align Right",
    description: "Align text to the right",
    keywords: ["align", "right", "alignment"],
    icon: AlignRight,
    category: "Alignment",
    run: (e) => e.chain().focus().setTextAlign("right").run(),
  },
  {
    title: "Justify",
    description: "Justify text alignment",
    keywords: ["align", "justify", "alignment"],
    icon: AlignJustify,
    category: "Alignment",
    run: (e) => e.chain().focus().setTextAlign("justify").run(),
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
          try {
            const docSize = editor.state.doc.content.size;
            const from = Math.max(0, Math.min(range.from, docSize));
            const to = Math.max(0, Math.min(range.to, docSize));
            if (to >= from) {
              editor.chain().focus().deleteRange({ from, to }).run();
            }
          } catch {}
          props.run(editor);
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
          let selectedIndex = 0;

          return {
            onStart: (props: any) => {
              component = document.createElement("div");
              component.className = "z-50";
              document.body.appendChild(component);
              renderList(component, props);
            },
            onUpdate(props: any) {
              if (!component) return;
              selectedIndex = 0;
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
              selectedIndex = 0;
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
                  width: "320px",
                });
              }
            }
            container.innerHTML = "";

            // Create the main container with shadcn styling
            const mainContainer = document.createElement("div");
            mainContainer.className = `
              bg-white border border-gray-200 rounded-lg shadow-lg
              overflow-hidden backdrop-blur-sm slash-command-menu
            `;

            // Create header
            const header = document.createElement("div");
            header.className = "px-3 py-2 border-b border-gray-100 bg-gray-50/50";
            header.innerHTML = `
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span class="text-xs font-medium text-gray-600">Slash Commands</span>
              </div>
            `;
            mainContainer.appendChild(header);

            // Create scrollable content area
            const contentArea = document.createElement("div");
            contentArea.className = "max-h-64 overflow-y-auto slash-command-scroll";

            // Group items by category
            const groupedItems = (items || []).reduce((acc: any, item: any) => {
              if (!acc[item.category]) {
                acc[item.category] = [];
              }
              acc[item.category].push(item);
              return acc;
            }, {});

            // Render grouped items
            Object.entries(groupedItems).forEach(([category, categoryItems]: [string, any]) => {
              // Category header
              const categoryHeader = document.createElement("div");
              categoryHeader.className = "px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50/30";
              categoryHeader.textContent = category;
              contentArea.appendChild(categoryHeader);

              // Category items
              categoryItems.forEach((item: any, idx: number) => {
                const itemIndex = Object.keys(groupedItems).indexOf(category) * 100 + idx;
                const el = document.createElement("button");
                el.type = "button";
                el.className = `
                  w-full flex items-center gap-3 px-3 py-2.5 text-left
                  hover:bg-gray-50 transition-colors duration-150
                  border-l-2 border-transparent hover:border-blue-200
                  ${selectedIndex === itemIndex ? 'bg-blue-50 border-blue-300' : ''}
                `;
                
                // Create icon
                const iconContainer = document.createElement("div");
                iconContainer.className = "flex-shrink-0 w-5 h-5 text-gray-400";
                
                // Create icon SVG (simplified version)
                const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                iconSvg.setAttribute("width", "16");
                iconSvg.setAttribute("height", "16");
                iconSvg.setAttribute("viewBox", "0 0 24 24");
                iconSvg.setAttribute("fill", "none");
                iconSvg.setAttribute("stroke", "currentColor");
                iconSvg.setAttribute("stroke-width", "2");
                iconSvg.setAttribute("stroke-linecap", "round");
                iconSvg.setAttribute("stroke-linejoin", "round");
                
                // Add appropriate icon path based on item type
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                switch (item.title) {
                  case "Text":
                    path.setAttribute("d", "M4 7V4h16v3M9 20h6M12 4v16");
                    break;
                  case "Heading 1":
                  case "Heading 2":
                  case "Heading 3":
                    path.setAttribute("d", "M4 12h16M4 6h16M4 18h16");
                    break;
                  case "Bullet List":
                    path.setAttribute("d", "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01");
                    break;
                  case "Numbered List":
                    path.setAttribute("d", "M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18h2v4M4 18h2");
                    break;
                  case "Blockquote":
                    path.setAttribute("d", "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z");
                    break;
                  case "Code Block":
                    path.setAttribute("d", "M16 18l6-6-6-6M8 6l-6 6 6 6");
                    break;
                  case "Divider":
                    path.setAttribute("d", "M5 12h14");
                    break;
                  case "Table":
                    path.setAttribute("d", "M12 3v18M3 12h18M3 6h18v12H3z");
                    break;
                  default:
                    path.setAttribute("d", "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z");
                }
                iconSvg.appendChild(path);
                iconContainer.appendChild(iconSvg);
                
                // Create content
                const content = document.createElement("div");
                content.className = "flex-1 min-w-0";
                content.innerHTML = `
                  <div class="font-medium text-gray-900 text-sm">${item.title}</div>
                  <div class="text-xs text-gray-500 truncate">${item.description}</div>
                `;
                
                el.appendChild(iconContainer);
                el.appendChild(content);
                
                el.addEventListener("click", () => command(item));
                el.addEventListener("mouseenter", () => {
                  // Remove previous selection
                  const prevSelected = contentArea.querySelector('.bg-blue-50');
                  if (prevSelected) {
                    prevSelected.classList.remove('bg-blue-50', 'border-blue-300');
                    prevSelected.classList.add('border-transparent');
                  }
                  // Add selection to current item
                  el.classList.remove('border-transparent');
                  el.classList.add('bg-blue-50', 'border-blue-300');
                  selectedIndex = itemIndex;
                });
                
                contentArea.appendChild(el);
                if (itemIndex === 0) el.focus();
              });
            });

            mainContainer.appendChild(contentArea);
            container.appendChild(mainContainer);

            onKeyDown = ({ event }: any) => {
              const totalItems = (items || []).length;
              
              if (event.key === "ArrowDown") {
                event.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, totalItems - 1);
                updateSelection();
                return true;
              }
              
              if (event.key === "ArrowUp") {
                event.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                updateSelection();
                return true;
              }
              
              if (event.key === "Enter") {
                event.preventDefault();
                const selectedItem = (items || [])[selectedIndex];
                if (selectedItem) command(selectedItem);
                return true;
              }
              
              if (event.key === "Escape") {
                event.preventDefault();
                props.editor.commands.focus();
                return true;
              }
              
              return false;
            };

            function updateSelection() {
              const buttons = contentArea.querySelectorAll('button');
              buttons.forEach((btn, idx) => {
                btn.classList.remove('bg-blue-50', 'border-blue-300');
                btn.classList.add('border-transparent');
                if (idx === selectedIndex) {
                  btn.classList.remove('border-transparent');
                  btn.classList.add('bg-blue-50', 'border-blue-300');
                  btn.scrollIntoView({ block: 'nearest' });
                }
              });
            }
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


