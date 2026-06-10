import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface FlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string, screenshot?: string) => void;
  clientName?: string;
  screenshot?: string;
}

export const FlagModal: React.FC<FlagModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  clientName,
  screenshot,
}) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!description.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(description, screenshot);
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
        {screenshot && (
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <p className="text-xs font-medium text-gray-500 p-2 bg-gray-50">Captured Screenshot</p>
            <img src={screenshot} alt="Flag evidence" className="w-full h-auto" />
          </div>
        )}
        
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
