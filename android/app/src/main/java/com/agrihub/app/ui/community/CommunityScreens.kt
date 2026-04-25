@file:OptIn(ExperimentalMaterial3Api::class)
package com.agrihub.app.ui.community

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.agrihub.app.data.model.*
import com.agrihub.app.data.repository.CommunityRepository
import com.agrihub.app.ui.components.*
import com.agrihub.app.ui.navigation.Routes
import com.agrihub.app.ui.theme.AppColor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CommunityViewModel @Inject constructor(private val repo: CommunityRepository) : ViewModel() {
    private val _posts = MutableStateFlow<List<CommunityPost>>(emptyList())
    val posts: StateFlow<List<CommunityPost>> = _posts.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun loadPosts(category: String? = null) = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try { _posts.value = repo.getPosts(category) } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }
    fun likePost(id: String) = viewModelScope.launch {
        try {
            repo.likePost(id)
            _posts.value = _posts.value.map { if (it.id == id) it.copy(likes = it.likes + 1) else it }
        } catch (_: Exception) {}
    }
    fun createPost(body: Map<String, Any?>, onSuccess: () -> Unit) = viewModelScope.launch {
        _loading.value = true; _error.value = null
        try { repo.createPost(body); onSuccess() } catch (e: Exception) { _error.value = e.message }
        _loading.value = false
    }
}

// ─── Community Screen ──────────────────────────────────────
@OptIn(ExperimentalMaterialApi::class)
@Composable
fun CommunityScreen(
    navController: NavController,
    onPostClick: ((CommunityPost) -> Unit)? = null,
    viewModel: CommunityViewModel = hiltViewModel(),
) {
    val posts by viewModel.posts.collectAsState()
    val loading by viewModel.loading.collectAsState()
    var selectedCategory by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(selectedCategory) { viewModel.loadPosts(selectedCategory) }
    val pullRefreshState = rememberPullRefreshState(loading, { viewModel.loadPosts(selectedCategory) })

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate(Routes.CREATE_POST) },
                containerColor = AppColor.Primary,
            ) { Icon(Icons.Default.Add, "New Post", tint = Color.White) }
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().background(AppColor.Background).padding(padding)) {
            GradientHeader("Community", "Discussions & knowledge sharing", AppColor.PrimaryDark, AppColor.Primary, onBack = { navController.popBackStack() })

            // Category filters
            Row(Modifier.padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf(null to "All", "general" to "General", "question" to "Questions", "tip" to "Tips", "market" to "Market").forEach { (cat, label) ->
                    FilterChip(selected = selectedCategory == cat, onClick = { selectedCategory = cat }, label = { Text(label, fontSize = 11.sp) })
                }
            }

            Box(Modifier.weight(1f).pullRefresh(pullRefreshState)) {
                when {
                    loading && posts.isEmpty() -> LoadingScreen()
                    posts.isEmpty() -> EmptyState("💬", "No posts yet", "Start the conversation!", "Create Post") { navController.navigate(Routes.CREATE_POST) }
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 4.dp)) {
                        items(posts) { post ->
                            Card(
                                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp).clickable {
                                    if (onPostClick != null) onPostClick(post) else navController.navigate(Routes.postDetail(post.id))
                                },
                                shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(2.dp),
                            ) {
                                Column(Modifier.padding(14.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            Modifier.size(36.dp).clip(CircleShape).background(AppColor.Primary.copy(alpha = 0.1f)),
                                            contentAlignment = Alignment.Center,
                                        ) { Text((post.author_name?.firstOrNull() ?: 'U').uppercase(), fontWeight = FontWeight.Bold, color = AppColor.Primary) }
                                        Spacer(Modifier.width(10.dp))
                                        Column(Modifier.weight(1f)) {
                                            Text(post.author_name ?: "User", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                            post.author_role?.let { Text(it.replaceFirstChar { c -> c.uppercase() }, fontSize = 11.sp, color = AppColor.TextMuted) }
                                        }
                                        StatusBadge(post.category, AppColor.Primary)
                                    }
                                    if (!post.title.isNullOrBlank()) {
                                        Text(post.title, fontWeight = FontWeight.Bold, fontSize = 15.sp, modifier = Modifier.padding(top = 8.dp))
                                    }
                                    Text(post.content, fontSize = 13.sp, color = AppColor.TextSecondary, modifier = Modifier.padding(top = 4.dp), maxLines = 4)
                                    Spacer(Modifier.height(8.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        IconButton(onClick = { viewModel.likePost(post.id) }, modifier = Modifier.size(32.dp)) {
                                            Icon(Icons.Default.ThumbUp, "Like", tint = AppColor.TextMuted, modifier = Modifier.size(16.dp))
                                        }
                                        Text("${post.likes}", fontSize = 12.sp, color = AppColor.TextMuted)
                                        Spacer(Modifier.width(16.dp))
                                        Text("💬 ${post.replies}", fontSize = 12.sp, color = AppColor.TextMuted)
                                        Spacer(Modifier.width(16.dp))
                                        Text("👁 ${post.views}", fontSize = 12.sp, color = AppColor.TextMuted)
                                    }
                                }
                            }
                        }
                    }
                }
                PullRefreshIndicator(loading, pullRefreshState, Modifier.align(Alignment.TopCenter), contentColor = AppColor.Primary)
            }
        }
    }
}

// ─── Post Detail + Comments ────────────────────────────────
@HiltViewModel
class PostDetailViewModel @Inject constructor(private val repo: CommunityRepository) : ViewModel() {
    private val _post = MutableStateFlow<CommunityPost?>(null)
    val post: StateFlow<CommunityPost?> = _post.asStateFlow()
    private val _comments = MutableStateFlow<List<PostComment>>(emptyList())
    val comments: StateFlow<List<PostComment>> = _comments.asStateFlow()
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()
    private val _posting = MutableStateFlow(false)
    val posting: StateFlow<Boolean> = _posting.asStateFlow()

    fun loadPost(post: CommunityPost) {
        _post.value = post
        loadComments(post.id)
    }

    fun loadComments(postId: String) = viewModelScope.launch {
        _loading.value = true
        try { _comments.value = repo.getComments(postId) } catch (_: Exception) {}
        _loading.value = false
    }

    fun likePost() = viewModelScope.launch {
        val p = _post.value ?: return@launch
        try {
            repo.likePost(p.id)
            _post.value = p.copy(likes = p.likes + 1)
        } catch (_: Exception) {}
    }

    fun addComment(postId: String, content: String, onDone: () -> Unit) = viewModelScope.launch {
        _posting.value = true
        try {
            val comment = repo.addComment(postId, content)
            _comments.value = _comments.value + comment
            _post.value = _post.value?.copy(replies = (_post.value?.replies ?: 0) + 1)
            onDone()
        } catch (_: Exception) {}
        _posting.value = false
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PostDetailScreen(
    navController: NavController,
    post: CommunityPost,
    viewModel: PostDetailViewModel = hiltViewModel(),
) {
    val currentPost by viewModel.post.collectAsState()
    val comments by viewModel.comments.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val posting by viewModel.posting.collectAsState()
    var commentText by remember { mutableStateOf("") }

    LaunchedEffect(post.id) { viewModel.loadPost(post) }

    val categoryColor = when (post.category) {
        "question" -> AppColor.Info; "tip" -> AppColor.Success
        "market" -> Color(0xFFFF6F00); else -> AppColor.Primary
    }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        // Header
        Box(
            Modifier
                .fillMaxWidth()
                .background(brush = androidx.compose.ui.graphics.Brush.verticalGradient(listOf(AppColor.PrimaryDark, AppColor.Primary)))
                .statusBarsPadding()
                .padding(16.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { navController.popBackStack() }) {
                    Text("←", fontSize = 20.sp, color = Color.White)
                }
                Column(Modifier.weight(1f)) {
                    Text("Community Post", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
                    Text(post.category.replaceFirstChar { it.uppercase() }, fontSize = 12.sp, color = Color.White.copy(0.8f))
                }
                StatusBadge(post.category, categoryColor)
            }
        }

        LazyColumn(
            Modifier.weight(1f),
            contentPadding = PaddingValues(bottom = 16.dp),
        ) {
            // Post card
            item {
                Card(
                    Modifier.fillMaxWidth().padding(16.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(3.dp),
                ) {
                    Column(Modifier.padding(16.dp)) {
                        // Author
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                Modifier.size(44.dp).clip(CircleShape).background(AppColor.Primary.copy(0.1f)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    (post.author_name?.firstOrNull() ?: 'U').uppercase(),
                                    fontWeight = FontWeight.Bold, fontSize = 18.sp, color = AppColor.Primary,
                                )
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(post.author_name ?: "User", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text(
                                    post.author_role?.replaceFirstChar { it.uppercase() } ?: "",
                                    fontSize = 12.sp, color = AppColor.TextMuted,
                                )
                            }
                            Spacer(Modifier.weight(1f))
                            post.created_at?.let { Text(formatPostTime(it), fontSize = 11.sp, color = AppColor.TextMuted) }
                        }

                        if (!post.title.isNullOrBlank()) {
                            Text(post.title, fontWeight = FontWeight.Bold, fontSize = 17.sp, modifier = Modifier.padding(top = 12.dp))
                        }
                        Text(post.content, fontSize = 14.sp, color = AppColor.TextSecondary, modifier = Modifier.padding(top = 6.dp), lineHeight = 22.sp)

                        post.district_name?.let {
                            Spacer(Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("📍", fontSize = 12.sp)
                                Spacer(Modifier.width(4.dp))
                                Text(it, fontSize = 12.sp, color = AppColor.TextMuted)
                            }
                        }

                        Divider(Modifier.padding(vertical = 10.dp), color = AppColor.Divider)

                        // Stats row
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Like button
                            val likedPost = currentPost ?: post
                            TextButton(onClick = { viewModel.likePost() }, contentPadding = PaddingValues(4.dp)) {
                                Icon(Icons.Default.ThumbUp, "Like", modifier = Modifier.size(16.dp), tint = AppColor.Primary)
                                Spacer(Modifier.width(4.dp))
                                Text("${likedPost.likes}", fontSize = 13.sp, color = AppColor.TextSecondary)
                            }
                            Spacer(Modifier.width(12.dp))
                            Text("💬 ${comments.size} comment${if (comments.size != 1) "s" else ""}", fontSize = 13.sp, color = AppColor.TextSecondary)
                            Spacer(Modifier.width(12.dp))
                            Text("👁 ${post.views}", fontSize = 13.sp, color = AppColor.TextSecondary)
                        }
                    }
                }
            }

            // Comments header
            item {
                Row(Modifier.padding(horizontal = 16.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("Comments (${comments.size})", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = AppColor.TextPrimary)
                    if (loading) {
                        Spacer(Modifier.width(8.dp))
                        CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp, color = AppColor.Primary)
                    }
                }
            }

            if (comments.isEmpty() && !loading) {
                item {
                    Box(Modifier.fillMaxWidth().padding(vertical = 24.dp), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("💬", fontSize = 40.sp)
                            Spacer(Modifier.height(8.dp))
                            Text("No comments yet. Be the first!", fontSize = 14.sp, color = AppColor.TextMuted)
                        }
                    }
                }
            }

            items(comments, key = { it.id }) { comment ->
                Card(
                    Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 3.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(1.dp),
                ) {
                    Row(Modifier.padding(12.dp)) {
                        Box(
                            Modifier.size(34.dp).clip(CircleShape).background(AppColor.Secondary.copy(0.15f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                (comment.author_name?.firstOrNull() ?: 'U').uppercase(),
                                fontWeight = FontWeight.Bold, fontSize = 13.sp, color = AppColor.Secondary,
                            )
                        }
                        Spacer(Modifier.width(10.dp))
                        Column(Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(comment.author_name ?: "User", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                comment.author_role?.let {
                                    Spacer(Modifier.width(6.dp))
                                    Text(it.replaceFirstChar { c -> c.uppercase() }, fontSize = 10.sp, color = AppColor.TextMuted)
                                }
                                Spacer(Modifier.weight(1f))
                                comment.created_at?.let { Text(formatPostTime(it), fontSize = 10.sp, color = AppColor.TextMuted) }
                            }
                            Text(comment.content, fontSize = 13.sp, color = AppColor.TextSecondary, modifier = Modifier.padding(top = 4.dp))
                            if (comment.likes > 0) {
                                Text("👍 ${comment.likes}", fontSize = 11.sp, color = AppColor.TextMuted, modifier = Modifier.padding(top = 4.dp))
                            }
                        }
                    }
                }
            }
        }

        // Comment input bar
        Surface(shadowElevation = 8.dp, color = Color.White) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp).navigationBarsPadding(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedTextField(
                    value = commentText,
                    onValueChange = { commentText = it },
                    placeholder = { Text("Write a comment…", fontSize = 13.sp) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(24.dp),
                    maxLines = 3,
                )
                Spacer(Modifier.width(8.dp))
                IconButton(
                    onClick = {
                        if (commentText.isNotBlank() && !posting) {
                            viewModel.addComment(post.id, commentText) { commentText = "" }
                        }
                    },
                    enabled = commentText.isNotBlank() && !posting,
                ) {
                    if (posting) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = AppColor.Primary)
                    else Text("➤", fontSize = 20.sp, color = if (commentText.isNotBlank()) AppColor.Primary else AppColor.TextMuted)
                }
            }
        }
    }
}

private fun formatPostTime(isoTime: String): String {
    return try {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
        val date = sdf.parse(isoTime.take(19)) ?: return isoTime
        val diff = System.currentTimeMillis() - date.time
        val min = diff / 60_000
        when {
            min < 1 -> "Just now"
            min < 60 -> "${min}m"
            min < 1440 -> "${min / 60}h"
            min < 10080 -> "${min / 1440}d"
            else -> java.text.SimpleDateFormat("dd MMM", java.util.Locale.getDefault()).format(date)
        }
    } catch (_: Exception) { "" }
}

// ─── Create Post ───────────────────────────────────────────
@Composable
fun CreatePostScreen(navController: NavController, viewModel: CommunityViewModel = hiltViewModel()) {
    val loading by viewModel.loading.collectAsState()
    val error by viewModel.error.collectAsState()
    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("general") }

    Column(Modifier.fillMaxSize().background(AppColor.Background)) {
        GradientHeader("New Post", "Share with the community", AppColor.PrimaryDark, AppColor.Primary, onBack = { navController.popBackStack() })
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(title, { title = it }, label = { Text("Title (optional)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("general", "question", "tip", "market").forEach { cat ->
                    FilterChip(selected = category == cat, onClick = { category = cat }, label = { Text(cat.replaceFirstChar { it.uppercase() }, fontSize = 11.sp) })
                }
            }

            OutlinedTextField(content, { content = it }, label = { Text("What's on your mind?") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), minLines = 5)

            error?.let { Text(it, color = AppColor.Error, fontSize = 12.sp) }

            Button(
                onClick = {
                    viewModel.createPost(mapOf("title" to title, "content" to content, "category" to category)) { navController.popBackStack() }
                },
                enabled = content.isNotBlank() && !loading,
                modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppColor.Primary),
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                else Text("Post", fontWeight = FontWeight.Bold)
            }
        }
    }
}
