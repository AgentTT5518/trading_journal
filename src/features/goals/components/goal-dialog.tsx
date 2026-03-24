'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { GoalForm } from './goal-form';
import type { Goal } from '../types';

type GoalDialogProps = {
  mode: 'create' | 'edit';
  goal?: Goal;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function GoalDialog({ mode, goal, open, onOpenChange }: GoalDialogProps) {
  const isEdit = mode === 'edit';

  const handleSuccess = () => {
    onOpenChange?.(false);
  };

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <GoalForm goal={goal} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            New Goal
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Goal</DialogTitle>
        </DialogHeader>
        <GoalForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
