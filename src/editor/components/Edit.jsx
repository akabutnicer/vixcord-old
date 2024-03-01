import React, {
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import Picker from "@emoji-mart/react";
import PrismPlugin from "slate-prism";
import SlateEditCode from "slate-edit-code";
import Plain, { deserialize } from "@opuscapita/slate-plain-serializer";

import {
  Editor,
  Transforms,
  Range,
  createEditor,
  Descendant,
  Text,
  Value,
} from "slate";
import * as SlateReact from "slate-react";
import data from "@emoji-mart/data";
import SoftBreak from "slate-soft-break";
import { withHistory } from "slate-history";

import {
  Slate,
  Editable,
  ReactEditor,
  useFocused,
  withReact,
  DefaultElement,
  useSelected,
  useSlate,
} from "slate-react";

import Default from "./Default.jsx";
import isHotkey from "is-hotkey";
// import slateToMd from "./conversion/markdown/slateToMd";
import Prism from "prismjs";
import { css } from "@emotion/css";
import { Typography } from "@material-ui/core";
(Prism.languages.markdown = Prism.languages.extend("markup", {})),
  Prism.languages.insertBefore("markdown", "prolog", {
    blockquote: { pattern: /^>(?:[\t ]*>)*/m, alias: "punctuation" },
    spoiler: {
      pattern: /\|\|(.*?)\|\|/m,
    },
    code: [
      { pattern: /^(?: {4}|\t).+/m, alias: "keyword" },
      {
        pattern: /`([\`a-zA-Z0-9!@#$%^&*\}\{\~\'\"])`|`[^`\n]+`/,
        alias: "keyword",
      },
    ],
    title: [
      {
        pattern: /\w+.*(?:\r?\n|\r)(?:==+|--+)/,
        alias: "important",
        inside: { punctuation: /==+$|--+$/ },
      },
      {
        pattern: /(^\s*)#+.+/m,
        lookbehind: !0,
        alias: "important",
        inside: { punctuation: /^#+|#+$/ },
      },
    ],
    hr: {
      pattern: /(^\s*)([*-])([\t ]*\2){2,}(?=\s*$)/m,
      lookbehind: !0,
      alias: "punctuation",
    },
    list: {
      pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,
      lookbehind: !0,
      alias: "punctuation",
    },
    "url-reference": {
      pattern:
        /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
      inside: {
        variable: { pattern: /^(!?\[)[^\]]+/, lookbehind: !0 },
        string: /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
        punctuation: /^[\[\]!:]|[<>]/,
      },
      alias: "url",
    },
    bold: {
      pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
      lookbehind: !0,
      inside: { punctuation: /^\*\*|^__|\*\*$|__$/ },
    },
    italic: {
      pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
      lookbehind: !0,
      inside: { punctuation: /^[*_]|[*_]$/ },
    },
    url: {
      pattern:
        /!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/,
      inside: {
        variable: { pattern: /(!?\[)[^\]]+(?=\]$)/, lookbehind: !0 },
        string: { pattern: /"(?:\\.|[^"\\])*"(?=\)$)/ },
      },
    },
  }),
  (Prism.languages.markdown.bold.inside.url = Prism.util.clone(
    Prism.languages.markdown.url
  )),
  (Prism.languages.markdown.italic.inside.url = Prism.util.clone(
    Prism.languages.markdown.url
  )),
  (Prism.languages.markdown.bold.inside.italic = Prism.util.clone(
    Prism.languages.markdown.italic
  )),
  (Prism.languages.markdown.italic.inside.bold = Prism.util.clone(
    Prism.languages.markdown.bold
  ));
function CodeNode(props) {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  );
}
const findPreBlocksInText = (text) => {
  const urlRegex =
    // eslint-disable-next-line no-useless-escape
    /```([a-zA-Z#&$_-]*)([\n\s]*)([^]*)```/gim;

  const matches = [...text.matchAll(urlRegex)];
  return matches
    ? matches.map((m, i) => [
        m.trim(),
        [...text.matchAll(urlRegex)][i].index || 0,
      ])
    : [];
};
const findUrlsInText = (text) => {
  const urlRegex =
    // eslint-disable-next-line no-useless-escape
    /(?:(?:http):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;

  const matches = text.match(urlRegex);

  return matches
    ? matches.map((m, i) => [m.trim(), [...text.matchAll(urlRegex)][i].index])
    : [];
};

const renderBlock = (props, editor, next) => {
  switch (props.node.type) {
    case "code":
      return <CodeNode {...props} />;
    default:
      return next();
  }
};
const MentionExample = (...args) => {
  const withMentions = (editor) => {
    const { isInline, isVoid, markableVoid } = editor;

    editor.isInline = (element) => {
      return element.type === "mention" ? true : isInline(element);
    };

    editor.isVoid = (element) => {
      return element.type === "mention" ? true : isVoid(element);
    };

    editor.markableVoid = (element) => {
      return element.type === "mention" || markableVoid(element);
    };

    return editor;
  };
  const ref = useRef(HTMLDivElement);
  var socket;
  useEffect(() => {
    socket = window.io();
  }, [window]);
  socket.on("new message", (data) => {});
  const [target, setTarget] = useState(Range | undefined);
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState("");
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const reverse = useRef(false);
  const editor = useMemo(
    () => withMentions(withReact(withHistory(createEditor()))),
    []
  );

  const chars = CHARACTERS.filter((c) =>
    c.toLowerCase().startsWith(search.toLowerCase())
  ).slice(0, 10);

  useEffect(() => {
    if (target && chars.length > 0) {
      const el = ref.current;
      const domRange = ReactEditor.toDOMRange(editor, target);
      const rect = domRange.getBoundingClientRect();
      el.style.position = "absolute";
      el.style.bottom = `82.5px`;
      el.style.left = "0";
      el.style.maxHeight = "500px";
    }
  }, [chars.length, editor, index, search, target]);
  const decorate = React.useCallback(([node, path]) => {
    console.log(node, path);
    var ranges = [];

    if (!Text.isText(node)) {
      return ranges;
    }

    const getLength = (token) => {
      if (typeof token === "string") {
        return token.length;
      } else if (typeof token.content === "string") {
        return token.content.length;
      } else {
        return token.content.reduce((l, t) => l + getLength(t), 0);
      }
    };

    const tokens = Prism.tokenize(node.text, Prism.languages.markdown);
    let start = 0;

    for (const token of tokens) {
      var length = getLength(token);
      var end = start + length;

      if (typeof token !== "string") {
        if (token.type === "blockquote") {
          --end;
          if (start !== 0) {
            --start;
          }
        }

        // const range = { anchor: { path, offset: start }, focus: start };
        // Transforms.select(editor, range);
        // CustomEditor.toggleMark(editor, token.type);
        ranges.push({
          [token.type]: true,
          anchor: { path, offset: start },
          focus: { path, offset: end },
        });
      }

      start = end;
    }
    const nodeText = node.text;

    if (!nodeText) ranges = [];
    const urls = findUrlsInText(nodeText);
    if (urls.length) {
      Array.from(urls).forEach(([url, index]) => {
        return ranges.push({
          anchor: {
            path,
            offset: index,
          },
          focus: {
            path,
            offset: index + url.length,
          },
          decoration: "link",
        });
      });
    }

    return ranges;
  }, []);


  const [tagTargetRange, setTagTargetRange] = React.useState();
  const [tagSearchString, setTagSearchString] = React.useState("");
  const [tagSearchIndex, setTagSearchIndex] = React.useState(0);
  const [emojiTargetRange, setEmojiTargetRange] = React.useState();
  const [emojiSearchString, setEmojiSearchString] = React.useState("");
  const [emojiSearchIndex, setEmojiSearchIndex] = React.useState(0);
  var [value, setValue] = React.useState();

  const [editorValue, setEditorValue] = React.useState("");
  const onKeyDown = useCallback(
    (event) => {
      setEditorValue(event.target.innerText);

      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        editorValue.replace(/(\s+)/g, "") !== ""
      ) {
        window.socket.emit("get id", (id) => {
          window.socket.emit("new message", {
            value: editorValue,
            id: id,
          });
        });
        Transforms.delete(editor, {
          at: {
            anchor: Editor.start(editor, []),
            focus: Editor.end(editor, []),
          },
        });
        // loop delete all
        editor.children.map((item) => {
          Transforms.delete(editor, { at: [0] });
        });

        // reset init
        editor.children = [
          {
            type: "p",
            children: [{ text: "" }],
          },
        ];
        ReactEditor.focus(editor);
      }
      if (target && chars.length > 0) {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            const prevIndex = index >= chars.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
            break;
          case "ArrowUp":
            event.preventDefault();
            const nextIndex = index <= 0 ? chars.length - 1 : index - 1;
            setIndex(nextIndex);
            break;
          case "Tab":
          case "Enter":
            event.preventDefault();
            Transforms.select(editor, target);
            insertMention(editor, chars[index]);
            setTarget(null);
            break;
          case "Escape":
            event.preventDefault();
            setTarget(null);
            break;
        }
      }
    },
    [chars, editor, index, target]
  );
  const [visible, setVisible] = React.useState(false);
  const insertEmoji = async (emoji) => {
    let sym = emoji.unified.split("-");
    let codesArray = [];
    sym.forEach((el) => codesArray.push("0x" + el));
    let emoji1 = String.fromCodePoint(...codesArray);
    ReactEditor.focus(editor);
    editor.insertText(emoji1);
    setVisible(false);
  };
  const [isHovering, setHovering] = React.useState(false);
  const toggleMark = (editor, format) => {
    const isActive = isMarkActive(editor, format);

    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const isMarkActive = (editor, format) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  };
 
  const [initialValue, setInitialValue] = useState([
    {
      type: "default",
      children: [{ text: "" }],
    },
  ]);

  const [typing, setTyping] = React.useState(null);
  const Emoji = (props) => <p {...props.attributes}>hello</p>;

  const insertMention = (editor, character) => {
    const mention = {
      type: "mention",
      character,
      children: [{ text: "" }],
    };
    Transforms.insertNodes(editor, mention);
    Transforms.move(editor);
  };

  // Borrow Leaf renderer from the Rich Text example.
  // In a real project you would get this via `withRichText(editor)` or similar.

  const Leaf = ({ attributes, children, leaf }) => {
    if (leaf.spoiler && !leaf.code) {
      children = (
        <span
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            paddingBottom: "3.5px",
          }}
        >
          {children}
        </span>
      );
    }
    if (leaf.blockquote) {
      children = (
        <blockquote
          style={{
            margin: "0",
            display: "inline",
            borderLeft: "4px solid rgb(78, 80, 88)",
            paddingLeft: "10px",
            color: "#aaa",
            fontStyle: "italic",
          }}
        >
          {children}
        </blockquote>
      );
    }
    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }

    if (leaf.code) {
      children = <code>{children}</code>;
    }
    if (leaf.code_block) {
    }
    if (leaf.italic) {
      children = <em>{children}</em>;
    }
    if (leaf.underline) {
      children = <u spellcheck="false">{children}</u>;
    }
    if (leaf.decoration === "link" && !leaf.code) {
      children = (
        <span
          className={"fake-link"}
          style={{ cursor: "pointer" }}
          onClick={() => {
            window.open(leaf.text, "_blank", "noopener,noreferrer");
          }}
        >
          {children}
        </span>
      );
    }

    return <span {...attributes}>{children}</span>;
  };
  return (
    <Slate
      data-slate-editor="true"
      style={{
        width: "100%",
        backgroundColor: "transparent",
        zIndex: "9999",
      }}
      onChange={(value) => {
        setInitialValue(value);
        const { selection } = editor;
        const isAstChange = editor.operations.some(
          (op) => "set_selection" !== op.type
        );
        if (isAstChange) {
          // Save the value to Local Storage.
          const content = JSON.stringify(value);
          localStorage.setItem("content", content);
        }
        if (selection && Range.isCollapsed(selection)) {
          const [start] = Range.edges(selection);
          const wordBefore = Editor.before(editor, start, { unit: "word" });
          const before = wordBefore && Editor.before(editor, wordBefore);
          const beforeRange = before && Editor.range(editor, before, start);
          const beforeText = beforeRange && Editor.string(editor, beforeRange);
          const beforeMatch = beforeText && beforeText.match(/^@(\w+)$/);
          const after = Editor.after(editor, start);
          const afterRange = Editor.range(editor, start, after);
          const afterText = Editor.string(editor, afterRange);
          const afterMatch = afterText.match(/^(\s|$)/);

          if (beforeMatch && afterMatch) {
            setTarget(beforeRange);
            setSearch(beforeMatch[1]);
            setIndex(0);
            return;
          }
        }

        setTarget(null);
      }}
      editor={editor}
      initialValue={initialValue}
      style={{
        position: "static",
      }}
    >
      {target && (
        <div ref={ref} data-cy="mentions-portal">
          <h3
            style={{
              fontSize: "12px",
              color: "rgb(181, 186, 193)",
              fontFamily: `'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            People matching: <strong>{search}</strong>
          </h3>
          {chars.map((char, i) => (
            <div
              key={char}
              className="mention-list-item"
              onClick={() => {
                Transforms.select(editor, target);
                insertMention(editor, char);
                setTarget(null);
              }}
              style={{
                padding: "8.5px 3px",
                borderRadius: "3px",
                background: index === i ? "rgb(181, 186, 193)" : "transparent",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {char}
              <span
                style={{
                  position: "absolute",
                  right: "20px",
                  color: "rgb(181, 186, 193)",
                }}
              >
                {char}
              </span>
            </div>
          ))}
        </div>
      )}

      <Editable
        placeholder="Message #general"
        class={"write-message"}
        style={{}}
        onKeyDown={onKeyDown}
        onKeyUp={(ev) => {
          setEditorValue(event.target.innerText);

          socket.emit("get id", (id) => {
            setTimeout(() => {
              socket.emit("typing", {
                username: id,
              });
              if (typing) {
                clearTimeout(typing);
                setTyping(null);
              }
              setTyping(
                setTimeout(() => {
                  socket.emit("stop typing", {
                    username: id,
                  });
                  setTyping(null);
                }, 1000)
              );
            }, 1000);
          });
        }}
        onInput={(event) => {
          setEditorValue(event.target.innerText);
        }}
        onDOMBeforeInput={(event) => {
          setEditorValue(event.target.innerText);
          switch (event.inputType) {
            case "formatBold":
              event.preventDefault();
              return toggleMark(editor, "bold");
            case "formatItalic":
              event.preventDefault();
              return toggleMark(editor, "italic");
            case "formatUnderline":
              event.preventDefault();
              return toggleMark(editor, "underline");
          }
        }}
        decorate={decorate}
        renderLeaf={renderLeaf}
        renderElement={renderElement}
      />
    </Slate>
  );
};
const Element = (props) => {
  const { attributes, children, element } = props;
  switch (element.type) {
    case "mention":
      return <Mention {...props} />;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Mention = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();
  const style = {
    borderRadius: "3px",
     padding: "0 2px",
    fontWeight: "500",
    unicodeBidi: "plaintext",
    color: "rgb(201, 205, 251)",
    background: "rgb(184, 76, 76)",
  };
  // See if our empty text child has any styling marks applied and apply those
  if (element.children[0].bold) {
    style.fontWeight = "bold";
  }
  if (element.children[0].italic) {
    style.fontStyle = "italic";
  }
  return (
    <span
      {...attributes}
      contentEditable={false}
      data-cy={`mention-${element.character.replace(/(\s+)/g, "-")}`}
      style={style}
    >
      @{element.character}
      {children}
    </span>
  );
};

const CHARACTERS = [
  "Aayla Secura",
  "Adi Gallia",
  "Admiral Dodd Rancit",
  "Admiral Firmus Piett",
  "Admiral Gial Ackbar",
  "Admiral Ozzel",
  "Admiral Raddus",
  "Admiral Terrinald Screed",
  "Admiral Trench",
  "Admiral U.O. Statura",
  "Agen Kolar",
  "Agent Kallus",
  "Aiolin and Morit Astarte",
  "Aks Moe",
  "Almec",
  "Alton Kastle",
  "Amee",
  "AP-5",
  "Armitage Hux",
  "Artoo",
  "Arvel Crynyd",
  "Asajj Ventress",
  "Aurra Sing",
  "AZI-3",
  "Bala-Tik",
  "Barada",
  "Bargwill Tomder",
  "Baron Papanoida",
  "Barriss Offee",
  "Baze Malbus",
  "Bazine Netal",
  "BB-8",
  "BB-9E",
  "Ben Quadinaros",
  "Berch Teller",
  "Beru Lars",
  "Bib Fortuna",
  "Biggs Darklighter",
  "Black Krrsantan",
  "Bo-Katan Kryze",
  "Boba Fett",
  "Bobbajo",
  "Bodhi Rook",
  "Borvo the Hutt",
  "Boss Nass",
  "Bossk",
  "Breha Antilles-Organa",
  "Bren Derlin",
  "Brendol Hux",
  "BT-1",
  "C-3PO",
  "C1-10P",
  "Cad Bane",
  "Caluan Ematt",
  "Captain Gregor",
  "Captain Phasma",
  "Captain Quarsh Panaka",
  "Captain Rex",
  "Carlist Rieekan",
  "Casca Panzoro",
  "Cassian Andor",
  "Cassio Tagge",
  "Cham Syndulla",
  "Che Amanwe Papanoida",
  "Chewbacca",
  "Chi Eekway Papanoida",
  "Chief Chirpa",
  "Chirrut Îmwe",
  "Ciena Ree",
  "Cin Drallig",
  "Clegg Holdfast",
  "Cliegg Lars",
  "Coleman Kcaj",
  "Coleman Trebor",
  "Colonel Kaplan",
  "Commander Bly",
  "Commander Cody (CC-2224)",
  "Commander Fil (CC-3714)",
  "Commander Fox",
  "Commander Gree",
  "Commander Jet",
  "Commander Wolffe",
  "Conan Antonio Motti",
  "Conder Kyl",
  "Constable Zuvio",
  "Cordé",
  "Cpatain Typho",
  "Crix Madine",
  "Cut Lawquane",
  "Dak Ralter",
  "Dapp",
  "Darth Bane",
  "Darth Maul",
  "Darth Tyranus",
  "Daultay Dofine",
  "Del Meeko",
  "Delian Mors",
  "Dengar",
  "Depa Billaba",
  "Derek Klivian",
  "Dexter Jettster",
  "Dineé Ellberger",
  "DJ",
  "Doctor Aphra",
  "Doctor Evazan",
  "Dogma",
  "Dormé",
  "Dr. Cylo",
  "Droidbait",
  "Droopy McCool",
  "Dryden Vos",
  "Dud Bolt",
  "Ebe E. Endocott",
  "Echuu Shen-Jon",
  "Eeth Koth",
  "Eighth Brother",
  "Eirtaé",
  "Eli Vanto",
  "Ellé",
  "Ello Asty",
  "Embo",
  "Eneb Ray",
  "Enfys Nest",
  "EV-9D9",
  "Evaan Verlaine",
  "Even Piell",
  "Ezra Bridger",
  "Faro Argyus",
  "Feral",
  "Fifth Brother",
  "Finis Valorum",
  "Finn",
  "Fives",
  "FN-1824",
  "FN-2003",
  "Fodesinbeed Annodue",
  "Fulcrum",
  "FX-7",
  "GA-97",
  "Galen Erso",
  "Gallius Rax",
  'Garazeb "Zeb" Orrelios',
  "Gardulla the Hutt",
  "Garrick Versio",
  "Garven Dreis",
  "Gavyn Sykes",
  "Gideon Hask",
  "Gizor Dellso",
  "Gonk droid",
  "Grand Inquisitor",
  "Greeata Jendowanian",
  "Greedo",
  "Greer Sonnel",
  "Grievous",
  "Grummgar",
  "Gungi",
  "Hammerhead",
  "Han Solo",
  "Harter Kalonia",
  "Has Obbit",
  "Hera Syndulla",
  "Hevy",
  "Hondo Ohnaka",
  "Huyang",
  "Iden Versio",
  "IG-88",
  "Ima-Gun Di",
  "Inquisitors",
  "Inspector Thanoth",
  "Jabba",
  "Jacen Syndulla",
  "Jan Dodonna",
  "Jango Fett",
  "Janus Greejatus",
  "Jar Jar Binks",
  "Jas Emari",
  "Jaxxon",
  "Jek Tono Porkins",
  "Jeremoch Colton",
  "Jira",
  "Jobal Naberrie",
  "Jocasta Nu",
  "Joclad Danva",
  "Joh Yowza",
  "Jom Barell",
  "Joph Seastriker",
  "Jova Tarkin",
  "Jubnuk",
  "Jyn Erso",
  "K-2SO",
  "Kanan Jarrus",
  "Karbin",
  "Karina the Great",
  "Kes Dameron",
  "Ketsu Onyo",
  "Ki-Adi-Mundi",
  "King Katuunko",
  "Kit Fisto",
  "Kitster Banai",
  "Klaatu",
  "Klik-Klak",
  "Korr Sella",
  "Kylo Ren",
  "L3-37",
  "Lama Su",
  "Lando Calrissian",
  "Lanever Villecham",
  "Leia Organa",
  "Letta Turmond",
  "Lieutenant Kaydel Ko Connix",
  "Lieutenant Thire",
  "Lobot",
  "Logray",
  "Lok Durd",
  "Longo Two-Guns",
  "Lor San Tekka",
  "Lorth Needa",
  "Lott Dod",
  "Luke Skywalker",
  "Lumat",
  "Luminara Unduli",
  "Lux Bonteri",
  "Lyn Me",
  "Lyra Erso",
  "Mace Windu",
  "Malakili",
  "Mama the Hutt",
  "Mars Guo",
  "Mas Amedda",
  "Mawhonic",
  "Max Rebo",
  "Maximilian Veers",
  "Maz Kanata",
  "ME-8D9",
  "Meena Tills",
  "Mercurial Swift",
  "Mina Bonteri",
  "Miraj Scintel",
  "Mister Bones",
  "Mod Terrik",
  "Moden Canady",
  "Mon Mothma",
  "Moradmin Bast",
  "Moralo Eval",
  "Morley",
  "Mother Talzin",
  "Nahdar Vebb",
  "Nahdonnis Praji",
  "Nien Nunb",
  "Niima the Hutt",
  "Nines",
  "Norra Wexley",
  "Nute Gunray",
  "Nuvo Vindi",
  "Obi-Wan Kenobi",
  "Odd Ball",
  "Ody Mandrell",
  "Omi",
  "Onaconda Farr",
  "Oola",
  "OOM-9",
  "Oppo Rancisis",
  "Orn Free Taa",
  "Oro Dassyne",
  "Orrimarko",
  "Osi Sobeck",
  "Owen Lars",
  "Pablo-Jill",
  "Padmé Amidala",
  "Pagetti Rook",
  "Paige Tico",
  "Paploo",
  "Petty Officer Thanisson",
  "Pharl McQuarrie",
  "Plo Koon",
  "Po Nudo",
  "Poe Dameron",
  "Poggle the Lesser",
  "Pong Krell",
  "Pooja Naberrie",
  "PZ-4CO",
  "Quarrie",
  "Quay Tolsite",
  "Queen Apailana",
  "Queen Jamillia",
  "Queen Neeyutnee",
  "Qui-Gon Jinn",
  "Quiggold",
  "Quinlan Vos",
  "R2-D2",
  "R2-KT",
  "R3-S6",
  "R4-P17",
  "R5-D4",
  "RA-7",
  "Rabé",
  "Rako Hardeen",
  "Ransolm Casterfo",
  "Rappertunie",
  "Ratts Tyerell",
  "Raymus Antilles",
  "Ree-Yees",
  "Reeve Panzoro",
  "Rey",
  "Ric Olié",
  "Riff Tamson",
  "Riley",
  "Rinnriyin Di",
  "Rio Durant",
  "Rogue Squadron",
  "Romba",
  "Roos Tarpals",
  "Rose Tico",
  "Rotta the Hutt",
  "Rukh",
  "Rune Haako",
  "Rush Clovis",
  "Ruwee Naberrie",
  "Ryoo Naberrie",
  "Sabé",
  "Sabine Wren",
  "Saché",
  "Saelt-Marae",
  "Saesee Tiin",
  "Salacious B. Crumb",
  "San Hill",
  "Sana Starros",
  "Sarco Plank",
  "Sarkli",
  "Satine Kryze",
  "Savage Opress",
  "Sebulba",
  "Senator Organa",
  "Sergeant Kreel",
  "Seventh Sister",
  "Shaak Ti",
  "Shara Bey",
  "Shmi Skywalker",
  "Shu Mai",
  "Sidon Ithano",
  "Sifo-Dyas",
  "Sim Aloo",
  "Siniir Rath Velus",
  "Sio Bibble",
  "Sixth Brother",
  "Slowen Lo",
  "Sly Moore",
  "Snaggletooth",
  "Snap Wexley",
  "Snoke",
  "Sola Naberrie",
  "Sora Bulq",
  "Strono Tuggs",
  "Sy Snootles",
  "Tallissan Lintra",
  "Tarfful",
  "Tasu Leech",
  "Taun We",
  "TC-14",
  "Tee Watt Kaa",
  "Teebo",
  "Teedo",
  "Teemto Pagalies",
  "Temiri Blagg",
  "Tessek",
  "Tey How",
  "Thane Kyrell",
  "The Bendu",
  "The Smuggler",
  "Thrawn",
  "Tiaan Jerjerrod",
  "Tion Medon",
  "Tobias Beckett",
  "Tulon Voidgazer",
  "Tup",
  "U9-C4",
  "Unkar Plutt",
  "Val Beckett",
  "Vanden Willard",
  "Vice Admiral Amilyn Holdo",
  "Vober Dand",
  "WAC-47",
  "Wag Too",
  "Wald",
  "Walrus Man",
  "Warok",
  "Wat Tambor",
  "Watto",
  "Wedge Antilles",
  "Wes Janson",
  "Wicket W. Warrick",
  "Wilhuff Tarkin",
  "Wollivan",
  "Wuher",
  "Wullf Yularen",
  "Xamuel Lennox",
  "Yaddle",
  "Yarael Poof",
  "Yoda",
  "Zam Wesell",
  "Zev Senesca",
  "Ziro the Hutt",
  "Zuckuss",
];

export default React.memo(MentionExample);
