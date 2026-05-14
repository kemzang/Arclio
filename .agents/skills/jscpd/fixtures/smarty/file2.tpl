{*
 * Smarty template - Common macros for forms and pagination
 *}

{function name="renderField" field="" label="" required=false}
<div class="form-group{if $required} required{/if}">
    <label for="{$field}">{$label}
        {if $required}<span class="required-mark">*</span>{/if}
    </label>
    <input type="text"
           id="{$field}"
           name="{$field}"
           value="{$form[$field]|escape}"
           class="form-control{if isset($errors[$field])} is-invalid{/if}" />
    {if isset($errors[$field])}
    <div class="invalid-feedback">{$errors[$field]}</div>
    {/if}
</div>
{/function}

{function name="renderPagination" page=1 totalPages=1}
<nav aria-label="Page navigation">
    <ul class="pagination">
        {if $page > 1}
        <li class="page-item">
            <a class="page-link" href="?page={$page-1}">Previous</a>
        </li>
        {/if}
        {for $i=1 to $totalPages}
        <li class="page-item{if $i == $page} active{/if}">
            <a class="page-link" href="?page={$i}">{$i}</a>
        </li>
        {/for}
        {if $page < $totalPages}
        <li class="page-item">
            <a class="page-link" href="?page={$page+1}">Next</a>
        </li>
        {/if}
    </ul>
</nav>
{/function}

{* File-specific: product catalog form *}
{renderField field="productName" label="Product Name" required=true}
{renderField field="price" label="Price" required=true}
{renderPagination page=$currentPage totalPages=$totalPages}
