import { useEffect, useRef, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Font,
  FontSize,
  FontFamily,
  FontColor,
  FontBackgroundColor,
  Heading,
  Alignment,
  List,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  Link,
  Undo,
  Essentials,
  Paragraph,
  BlockQuote,
  Base64UploadAdapter,
  Indent,
  IndentBlock,
  HorizontalLine,
  RemoveFormat,
  SourceEditing,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

interface CKEditorComponentProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function CKEditorComponent({
  content,
  onChange,
  placeholder = 'Escreva aqui...',
  minHeight = '400px',
}: CKEditorComponentProps) {
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setIsLayoutReady(true);
    return () => setIsLayoutReady(false);
  }, []);

  if (!isLayoutReady) {
    return <div className="border rounded-lg p-4 bg-muted/30">Carregando editor...</div>;
  }

  return (
    <div className="ckeditor-wrapper" style={{ minHeight }}>
      <CKEditor
        editor={ClassicEditor}
        data={content}
        onChange={(event, editor) => {
          const data = editor.getData();
          onChange(data);
        }}
        onReady={(editor) => {
          editorRef.current = editor;
        }}
        config={{
          plugins: [
            Essentials,
            Paragraph,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            Font,
            FontSize,
            FontFamily,
            FontColor,
            FontBackgroundColor,
            Heading,
            Alignment,
            List,
            Image,
            ImageCaption,
            ImageResize,
            ImageStyle,
            ImageToolbar,
            ImageUpload,
            Base64UploadAdapter,
            Table,
            TableToolbar,
            TableProperties,
            TableCellProperties,
            Link,
            Undo,
            BlockQuote,
            Indent,
            IndentBlock,
            HorizontalLine,
            RemoveFormat,
            SourceEditing,
          ],
          toolbar: {
            items: [
              'undo',
              'redo',
              '|',
              'heading',
              '|',
              'fontSize',
              'fontFamily',
              'fontColor',
              'fontBackgroundColor',
              '|',
              'bold',
              'italic',
              'underline',
              'strikethrough',
              '|',
              'alignment',
              '|',
              'numberedList',
              'bulletedList',
              '|',
              'outdent',
              'indent',
              '|',
              'link',
              'insertImage',
              'insertTable',
              'blockQuote',
              'horizontalLine',
              '|',
              'removeFormat',
              'sourceEditing',
            ],
            shouldNotGroupWhenFull: true,
          },
          fontSize: {
            options: [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72],
            supportAllValues: true,
          },
          fontFamily: {
            options: [
              'default',
              'Arial, Helvetica, sans-serif',
              'Courier New, Courier, monospace',
              'Georgia, serif',
              'Lucida Sans Unicode, Lucida Grande, sans-serif',
              'Tahoma, Geneva, sans-serif',
              'Times New Roman, Times, serif',
              'Trebuchet MS, Helvetica, sans-serif',
              'Verdana, Geneva, sans-serif',
            ],
            supportAllValues: true,
          },
          heading: {
            options: [
              { model: 'paragraph', title: 'Parágrafo', class: 'ck-heading_paragraph' },
              { model: 'heading1', view: 'h1', title: 'Título 1', class: 'ck-heading_heading1' },
              { model: 'heading2', view: 'h2', title: 'Título 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Título 3', class: 'ck-heading_heading3' },
              { model: 'heading4', view: 'h4', title: 'Título 4', class: 'ck-heading_heading4' },
            ],
          },
          alignment: {
            options: ['left', 'center', 'right', 'justify'],
          },
          image: {
            toolbar: [
              'imageTextAlternative',
              'toggleImageCaption',
              '|',
              'imageStyle:inline',
              'imageStyle:block',
              'imageStyle:side',
              '|',
              'resizeImage',
            ],
            resizeOptions: [
              {
                name: 'resizeImage:original',
                label: 'Original',
                value: null,
              },
              {
                name: 'resizeImage:50',
                label: '50%',
                value: '50',
              },
              {
                name: 'resizeImage:75',
                label: '75%',
                value: '75',
              },
            ],
          },
          table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
          },
          placeholder,
          link: {
            decorators: {
              openInNewTab: {
                mode: 'manual',
                label: 'Abrir em nova aba',
                attributes: {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
