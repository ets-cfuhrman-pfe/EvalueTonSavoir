

// utils.js
export async function generateUniqueTitle(baseTitle:string, existsCallback:CallableFunction) {
    console.log(`generateUniqueTitle(${baseTitle})`);
    let newTitle = baseTitle;
    let counter = 1;

    const titleRegex = /(.*?)(\((\d+)\))?$/;
    const match = baseTitle.match(titleRegex);
    if (match) {
        baseTitle = match[1].trim();
        counter = match[3] ? parseInt(match[3], 10) + 1 : 1;
    }

    // If the base title does not end with a parentheses expression, start with "(1)"
    if (match != null && match[2] != null) {
        newTitle = `${baseTitle} (${counter})`;
    } else {
        // else increment the counter in the parentheses expression as a first try
        newTitle = `${baseTitle} (${counter})`;
    }

    console.log(`first check of newTitle: ${newTitle}`);

    while (await existsCallback(newTitle)) {
        counter++;
        newTitle = `${baseTitle} (${counter})`;
        console.log(`trying newTitle: ${newTitle}`);
    }

    return newTitle;
}