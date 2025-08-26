import { useState } from 'react';

export function useEditing() {
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingDescId, setEditingDescId] = useState<string | null>(null);
    const [titleDraft, setTitleDraft] = useState<string>('');
    const [descDraft, setDescDraft] = useState<string>('');
    const [showModal, setShowModal] = useState<boolean>(false);

    return {
        editingTaskId,
        setEditingTaskId,
        editingDescId,
        setEditingDescId,
        titleDraft,
        setTitleDraft,
        descDraft,
        setDescDraft,
        showModal,
        setShowModal,
    };
}