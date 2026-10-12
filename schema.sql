create database if not exists konser_ukk;
use konser_ukk;

create table users (
	id int primary key auto_increment,
    name varchar(100) not null ,
    email varchar(150) not null unique,
    password varchar(100) not null,
    phone varchar(20),
    role enum("superadmin","event_organizer","user") default "user",
    is_active boolean default true ,
	created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

create table concert (
	id int primary key auto_increment,
    title varchar(200),
    description varchar(300),
    venue varchar(200),
    location varchar(200),
    date datetime, 
    banner_url varchar(500),
    status enum("draft","published","cancelled"),
    created_by int not null,
    created_at timestamp,
    foreign key (created_by) references users(id) on delete cascade
);

create table ticket_tier(
	id int primary key auto_increment,
    concert_id int not null,
    name varchar(150),
    price decimal ,
    quota int,
    sold int ,
    sale_start datetime,
    sale_end datetime,
	foreign key (concert_id) references concert(id) on delete cascade
);

create table order_ticket(
	id int primary key auto_increment,
    user_id int not null,
    concert_id int not null,
    status enum("pending","paid","cancelled","expired") default "pending",
    total_price decimal,
    payment_method varchar(60),
    payment_token varchar(200),
    expires_at timestamp,
    created_at timestamp,
	foreign key (concert_id) references concert(id) on delete cascade,
    foreign key (user_id) references users(id) on delete cascade
);

create table order_detail(
	id int primary key auto_increment,
    order_id int not null,
    ticket_tier_id int not null,
    quantity int, 
    unit_price decimal,
    subtotal decimal,
    foreign key (order_id) references order_ticket(id) on delete cascade,
    foreign key (ticket_tier_id) references ticket_tier(id) on delete cascade 
);

create table ticket(
	id int primary key auto_increment,
    order_detail_id int not null,
    user_id int not null,
    concert_id int not null,
    ticket_tier_id int not null,
    qr_code varchar(200),
    status enum("used","unused", "cancelled"), 
    check_in_at timestamp,
    check_out_by int not null,
    foreign key (user_id) references users(id) on delete cascade,
    foreign key (ticket_tier_id) references ticket_tier(id) on delete cascade,
	foreign key (concert_id) references concert(id) on delete cascade,
    foreign key (user_id) references users(id) on delete cascade,
    foreign key (order_detail_id) references order_detail(id) on delete cascade
);

create table notification(
	id int primary key auto_increment,
    user_id int not null,
    title varchar(70),
    message text,
    is_read boolean default false not null,
    created_at timestamp,
    foreign key (user_id) references users(id) on delete cascade
);

