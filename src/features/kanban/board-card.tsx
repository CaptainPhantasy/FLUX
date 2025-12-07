// @ts-nocheck
// =====================================
// FLUX - Kanban Feature - BoardCard
// Buttery smooth animations
// =====================================

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { Task } from '@/types';
import { FluxCard } from './flux-card';

interface BoardCardProps {
    task: Task;
    onEdit?: (task: Task) => void;
}

// Smooth spring animation for card movements
const cardMotionVariants = {
    initial: { 
        opacity: 0, 
        y: 8,
        scale: 0.98 
    },
    animate: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 0.8,
        }
    },
    exit: { 
        opacity: 0, 
        scale: 0.95,
        transition: { duration: 0.15, ease: "easeOut" }
    },
};

export function BoardCard({ task, onEdit }: BoardCardProps) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
        // Smoother sorting animation
        transition: {
            duration: 250,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        },
    });

    // Custom smooth transition with spring feel
    const style = {
        transition: transition || 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)',
        transform: CSS.Translate.toString(transform),
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 scale-[0.98] transition-all duration-200"
            >
                <FluxCard task={task} isDragging onEdit={onEdit} />
            </div>
        );
    }

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="touch-none"
            variants={cardMotionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
            layoutId={task.id}
            whileHover={{ 
                y: -2,
                transition: { duration: 0.2, ease: "easeOut" }
            }}
            whileTap={{ scale: 0.98 }}
        >
            <FluxCard task={task} onEdit={onEdit} />
        </motion.div>
    );
}
