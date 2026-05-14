class DATA_PROCESSOR

create
    make, make_with_capacity

feature {NONE} -- Initialization

    make
        do
            capacity := Default_capacity
            create items.make (capacity)
        end

    make_with_capacity (a_capacity: INTEGER)
        require
            positive_capacity: a_capacity > 0
        do
            capacity := a_capacity
            create items.make (a_capacity)
        end

feature -- Access

    count: INTEGER
        do
            Result := items.count
        end

    is_empty: BOOLEAN
        do
            Result := items.is_empty
        end

feature -- Element change

    add_item (an_item: STRING)
        require
            valid_item: an_item /= Void and then not an_item.is_empty
            not_too_long: an_item.count <= Max_item_length
        do
            items.extend (an_item)
        ensure
            count_increased: count = old count + 1
        end

feature -- Querying

    find_item (a_key: STRING): detachable STRING
        do
            if attached items.linear_representation as l then
                l.start
                from l.start until l.after loop
                    if l.item ~ a_key then Result := l.item end
                    l.forth
                end
            end
        end

feature {NONE} -- Implementation

    items: ARRAYED_LIST [STRING]
    capacity: INTEGER
    Default_capacity: INTEGER = 100
    Max_item_length: INTEGER  = 255

end
