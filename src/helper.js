exports.getNumberUserId = function(userId) {
    return userId.replace(/(\D)/g, '');
}

exports.getGroup = function(list=[]) {
    let group = {};
    for(let i = 0; i < list.length; i++) {
        let item = list[i];
        let vendorId = item.vendor_id;
        if(vendorId) {
            if(group[vendorId]) {
                group[vendorId].push(item);
            } else {
                group[vendorId] = [item];
            }
        }
    };
    return group;
};
