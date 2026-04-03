export async function deriveKey(roomId) {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(roomId);
    
    // Hash the room ID to create a consistent 256-bit key
    const digest = await crypto.subtle.digest('SHA-256', passwordData);
    
    return await crypto.subtle.importKey(
        'raw',
        digest,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptMessage(text, key) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    const encodedMessage = encoder.encode(text);
    
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedMessage
    );

    // Return IV + Ciphertext as a single Buffer
    return {
        iv: btoa(String.fromCharCode(...iv)),
        data: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
    };
}

export async function decryptMessage(encryptedObj, key) {
    const iv = new Uint8Array(atob(encryptedObj.iv).split('').map(c => c.charCodeAt(0)));
    const data = new Uint8Array(atob(encryptedObj.data).split('').map(c => c.charCodeAt(0)));
    
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
}