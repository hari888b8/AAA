package com.agrihub.app.ui.navigation

import androidx.lifecycle.ViewModel
import com.agrihub.app.data.model.CommunityPost
import com.agrihub.app.data.model.Order
import com.agrihub.app.data.model.Property
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

/**
 * Scoped to the NavGraph host Activity — used to shuttle rich objects between
 * list screens and their detail screens without serializing to URL params.
 */
@HiltViewModel
class SharedViewModel @Inject constructor() : ViewModel() {
    private val _selectedPost = MutableStateFlow<CommunityPost?>(null)
    val selectedPost: StateFlow<CommunityPost?> = _selectedPost.asStateFlow()

    private val _selectedProperty = MutableStateFlow<Property?>(null)
    val selectedProperty: StateFlow<Property?> = _selectedProperty.asStateFlow()

    private val _selectedOrder = MutableStateFlow<Order?>(null)
    val selectedOrder: StateFlow<Order?> = _selectedOrder.asStateFlow()

    fun selectPost(post: CommunityPost) { _selectedPost.value = post }
    fun selectProperty(prop: Property) { _selectedProperty.value = prop }
    fun selectOrder(order: Order) { _selectedOrder.value = order }
}
