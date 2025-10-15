// SPDX-FileCopyrightText: 2025 Weibo, Inc.
//
// SPDX-License-Identifier: Apache-2.0

package ai.novelweave.jetbrains.ipc.proxy.interfaces

import ai.novelweave.jetbrains.editor.DocumentsAndEditorsDelta


interface ExtHostDocumentsAndEditorsProxy {
    fun acceptDocumentsAndEditorsDelta(d: DocumentsAndEditorsDelta)
}