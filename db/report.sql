create table report(
    id int(10) not null auto_increment,
    title varchar(255),
    sql_query text,
    primary key(id)
);
