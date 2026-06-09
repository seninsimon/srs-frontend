import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface FlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string) => void;
  clientName?: string;
}

export const FlagModal: React.FC<FlagModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  clientName,
}) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!description.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(description);
    setIsSubmitting(false);
    setDescription('');
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create Flag${clientName ? ` for ${clientName}` : ''}`}
      size="sm"
    >
      <div className="space-y-4">
        <Input
          label="Description"
          placeholder="Describe what you noticed..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          textarea
        />
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!description.trim()}
          >
            Create Flag
          </Button>
        </div>
      </div>
    </Modal>
  );
};
