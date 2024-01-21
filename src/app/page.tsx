'use client';

import Image from 'next/image';
import { useRef, useState, ChangeEvent } from 'react';

type UploadedImage = {
    src: string;
    name: string;
};

export default function Home() {
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            setError('No files selected.');
            return;
        }

        setError(null);
        const formData = new FormData();

        formData.append('file', e.target.files[0]);

        try {
            const response = await fetch('/api/crop-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to process images');
            }

            // Handle the response (assuming JSON response with image URLs or similar)
            const processedImages = await response.json();
            setUploadedImages(processedImages); // Update this line based on your response structure
        } catch (error) {
            setError('Error processing images.');
        }
    };

    const testClick = async () => {
        try {
            const response = await fetch('/api/test', {
                method: 'GET',
            });

            const processedImages = await response.json();
            console.log(processedImages);
        } catch (error) {
            setError('Error processing images.');
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const renderImages = () => {
        return uploadedImages.map((image, index) => (
            <div key={index} className="m-4">
                <Image
                    src={image.src}
                    alt={`Uploaded image ${image.name}`}
                    width={200}
                    height={200}
                />
            </div>
        ));
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
            <h1 className="mb-6 text-4xl font-bold">Image Cropper</h1>
            <button
                type="button"
                onClick={triggerFileInput}
                className="mb-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition duration-300"
            >
                Upload Images
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
            />
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex flex-wrap justify-center">
                {renderImages()}
            </div>
            <button type="button" onClick={testClick}>
                Test
            </button>
        </main>
    );
}
