import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface MergeRequest {
  userId: string;
  projectId: string;
  fileName: string;
  totalChunks: number;
  mimeType: string;
  fileSize: number;
}

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, projectId, fileName, totalChunks, mimeType, fileSize }: MergeRequest = await req.json();

    console.log(`Starting merge for ${fileName} with ${totalChunks} chunks`);

    // Download all chunks
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${userId}/${projectId}/${fileName}.part${i}`;
      
      const { data, error } = await supabase.storage
        .from("media")
        .download(chunkPath);

      if (error) {
        throw new Error(`Failed to download chunk ${i}: ${error.message}`);
      }

      const arrayBuffer = await data.arrayBuffer();
      chunks.push(new Uint8Array(arrayBuffer));
      console.log(`Downloaded chunk ${i}, size: ${arrayBuffer.byteLength} bytes`);
    }

    // Calculate total size and merge chunks
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    console.log(`Total merged size: ${totalSize} bytes`);

    const mergedArray = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      mergedArray.set(chunk, offset);
      offset += chunk.length;
    }

    // Create blob with correct MIME type
    const mergedBlob = new Blob([mergedArray], { type: mimeType });

    // Upload merged file
    const finalPath = `${userId}/${projectId}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(finalPath, mergedBlob, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload merged file: ${uploadError.message}`);
    }

    console.log(`Merged file uploaded successfully: ${finalPath}`);

    // Delete chunk files
    const chunkPaths = Array.from({ length: totalChunks }, (_, i) => 
      `${userId}/${projectId}/${fileName}.part${i}`
    );

    const { error: deleteError } = await supabase.storage
      .from("media")
      .remove(chunkPaths);

    if (deleteError) {
      console.error(`Warning: Failed to delete chunks: ${deleteError.message}`);
      // Don't throw - merged file is already uploaded
    } else {
      console.log(`Deleted ${totalChunks} chunk files`);
    }

    // Update media_files record with final path and size
    const { error: updateError } = await supabase
      .from("media_files")
      .update({
        storage_path: finalPath,
        file_size: fileSize
      })
      .eq("project_id", projectId)
      .eq("file_name", fileName);

    if (updateError) {
      console.error(`Warning: Failed to update database: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Chunks merged successfully",
        finalPath,
        size: totalSize
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (error) {
    console.error("Merge error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});