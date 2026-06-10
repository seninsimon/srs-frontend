import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface FlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string, cameraScreenshot?: string, screenScreenshot?: string) => void;
  clientName?: string;
  cameraScreenshot?: string;
  screenScreenshot?: string;
}

export const FlagModal: React.FC<FlagModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  clientName,
  cameraScreenshot,
  screenScreenshot,
}) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!description.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(description, cameraScreenshot, screenScreenshot);
    setIsSubmitting(false);
    setDescription('');
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create Flag${clientName ? ` for ${clientName}` : ''}`}
      size="md"
    >
      <div className="space-y-4">
        {(cameraScreenshot || screenScreenshot) && (
          <div className="grid grid-cols-2 gap-4">
            {cameraScreenshot && (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <p className="text-xs font-medium text-gray-500 p-2 bg-gray-50">Camera</p>
                <img src={cameraScreenshot} alt="Camera feed" className="w-full h-auto" />
              </div>
            )}
            {screenScreenshot && (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <p className="text-xs font-medium text-gray-500 p-2 bg-gray-50">Screen</p>
                <img src={screenScreenshot} alt="Screen share" className="w-full h-auto" />
              </div>
            )}
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
