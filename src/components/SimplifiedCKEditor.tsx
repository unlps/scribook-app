import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Bold,
  Essentials,
  Italic,
  Paragraph,
  Undo,
  Heading,
  Font,
  Alignment,
  List,
  Underline,
  Indent,
  IndentBlock,
  RemoveFormat,
  Base64UploadAdapter
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

interface SimplifiedCKEditorProps {
  value: string;
  onChange: (data: string) => void;
}

export default function SimplifiedCKEditor({ value, onChange }: SimplifiedCKEditorProps) {
  const editorConfiguration = {
    licenseKey: 'GPL',
    plugins: [
      Essentials,
      Bold,
      Italic,
      Underline,
      Paragraph,
      Heading,
      Font,
      Alignment,
      List,
      Undo,
      Indent,
      IndentBlock,
      RemoveFormat,
      Base64UploadAdapter
    ],
    toolbar: {
      items: [
        'undo', 'redo',
        '|',
        'heading',
        '|',
        'fontSize', 'fontFamily',
        '|',
        'bold', 'italic', 'underline',
        '|',
        'alignment',
        '|',
        'bulletedList', 'numberedList',
        '|',
        'outdent', 'indent',
        '|',
        'removeFormat'
      ],
      shouldNotGroupWhenFull: true
    },
    heading: {
      options: [
        { model: 'paragraph' as const, title: 'Parágrafo', class: 'ck-paragraph' },
        { model: 'heading1' as const, view: 'h1', title: 'Título 1', class: 'ck-heading1' },
        { model: 'heading2' as const, view: 'h2', title: 'Título 2', class: 'ck-heading2' },
        { model: 'heading3' as const, view: 'h3', title: 'Título 3', class: 'ck-heading3' }
      ]
    },
    fontSize: {
      options: [10, 11, 12, 14, 16, 18, 20, 24],
      supportAllValues: true
    },
    fontFamily: {
      options: [
        'default',
        'Arial, Helvetica, sans-serif',
        'Times New Roman, Times, serif',
        'Georgia, serif',
        'Verdana, Geneva, sans-serif'
      ],
      supportAllValues: true
    },
    placeholder: 'Digite o conteúdo aqui...',
    initialData: value
  };

  return (
    <div className="a4-editor-wrapper">
      <div className="a4-page">
        <CKEditor
          editor={ClassicEditor}
          config={editorConfiguration}
          data={value}
          onChange={(event, editor) => {
            const data = editor.getData();
            onChange(data);
          }}
        />
      </div>
    </div>
  );
}
