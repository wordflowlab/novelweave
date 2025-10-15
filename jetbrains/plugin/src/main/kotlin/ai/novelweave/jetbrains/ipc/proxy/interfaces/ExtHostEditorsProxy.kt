// SPDX-FileCopyrightText: 2025 Weibo, Inc.
//
// SPDX-License-Identifier: Apache-2.0

package ai.novelweave.jetbrains.ipc.proxy.interfaces

import ai.novelweave.jetbrains.editor.EditorPropertiesChangeData
import ai.novelweave.jetbrains.editor.TextEditorDiffInformation


interface ExtHostEditorsProxy {
    fun acceptEditorPropertiesChanged(id: String, props: EditorPropertiesChangeData)
    fun acceptEditorPositionData(data: Map<String , Int>)
    fun acceptEditorDiffInformation(id: String, diffInformation: List<TextEditorDiffInformation>?)
}