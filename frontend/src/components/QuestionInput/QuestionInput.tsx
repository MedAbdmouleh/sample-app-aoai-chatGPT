import React, { useState, useContext } from 'react';
import { FontIcon, Stack, TextField } from '@fluentui/react';
import { SendRegular } from '@fluentui/react-icons';
import Send from '../../assets/Send.svg'; // Ensure this path is correct
import AttachIcon from '../../assets/attach-icon.png'; // Save the attach icon locally and ensure this path is correct
import styles from './QuestionInput.module.css';
import { ChatMessage } from '../../api';
import { AppStateContext } from '../../state/AppProvider';
import { resizeImage } from '../../utils/resizeImage';

interface Props {
  onSend: (question: ChatMessage['content'], id?: string) => void;
  disabled: boolean;
  placeholder?: string;
  clearOnSend?: boolean;
  conversationId?: string;
}

export const QuestionInput = ({
  onSend,
  disabled,
  placeholder,
  clearOnSend,
  conversationId,
}: Props) => {
  const [question, setQuestion] = useState<string>('');
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const appStateContext = useContext(AppStateContext);
  const OYD_ENABLED = appStateContext?.state.frontendSettings?.oyd_enabled || false;

  const handleFileAttach = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('File uploaded successfully:', result);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload the file. Please try again.');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await convertToBase64(file);
    }
  };

  const convertToBase64 = async (file: Blob) => {
    try {
      const resizedBase64 = await resizeImage(file, 800, 800);
      setBase64Image(resizedBase64);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendQuestion = () => {
    if (disabled || !question.trim()) return;

    const questionContent: ChatMessage['content'] = base64Image
      ? [{ type: 'text', text: question }, { type: 'image_url', image_url: { url: base64Image } }]
      : question.toString();

    onSend(questionContent, conversationId);
    setBase64Image(null);

    if (clearOnSend) {
      setQuestion('');
    }
  };

  const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      sendQuestion();
    }
  };

  const onQuestionChange = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setQuestion(newValue || '');
  };

  const sendQuestionDisabled = disabled || !question.trim();

  return (
    <Stack horizontal className={styles.questionInputContainer}>
      {/* Input Text Field */}
      <TextField
        className={styles.questionInputTextArea}
        placeholder={placeholder || 'Type your message...'}
        multiline
        resizable={false}
        borderless
        value={question}
        onChange={onQuestionChange}
        onKeyDown={onEnterPress}
      />

      {/* File Upload Icon */}
      <div className={styles.fileAttachContainer}>
        <input
          type="file"
          id="attachFileInput"
          onChange={handleFileAttach}
          className={styles.fileInput}
        />
        <label htmlFor="attachFileInput" className={styles.fileAttachLabel}>
          <img src={AttachIcon} alt="Attach File" className={styles.attachIcon} />
        </label>
      </div>

      {/* Image Preview */}
      {base64Image && (
        <img className={styles.uploadedImage} src={base64Image} alt="Uploaded Preview" />
      )}

      {/* Send Button */}
      <div
        className={styles.questionInputSendButtonContainer}
        role="button"
        onClick={sendQuestion}
      >
        {sendQuestionDisabled ? (
          <SendRegular className={styles.questionInputSendButtonDisabled} />
        ) : (
          <img src={Send} className={styles.questionInputSendButton} alt="Send Button" />
        )}
      </div>

      {/* File Name Display */}
      {fileName && <span className={styles.fileName}>Attached: {fileName}</span>}
    </Stack>
  );
};
